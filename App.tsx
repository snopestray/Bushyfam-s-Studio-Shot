import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { ImageProcessor } from './components/ImageProcessor';
import { ImageGridItem } from './components/ImageGridItem';
import { transformImage } from './services/geminiService';
import { fileToBase64, dataUrlToBlob } from './utils/fileUtils';
import { initDB, setItem, getItem, deleteItem } from './utils/db';
import type { ProcessedImage } from './types';
import { ProcessingStatus } from './types';
import { TrashIcon, ViewGridIcon, ViewListIcon, ZipIcon, SparklesIcon, AppLogo, CreditCardIcon } from './components/IconComponents';

type ViewMode = 'list' | 'grid';
type Theme = 'light' | 'dark';

interface SerializableProcessedImage {
    id: string;
    status: ProcessingStatus;
    error?: string;
    originalFileName: string;
    processedFileName?: string;
}

const App: React.FC = () => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isHydrating, setIsHydrating] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [theme, setTheme] = useState<Theme>('light');
  
  // --- Monetization State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userCredits, setUserCredits] = useState(5); // Start with 5 free credits
  // --- End Monetization State ---

  const imagesRef = useRef(images);
  imagesRef.current = images;

  const isProcessing = useMemo(() => images.some(img => img.status === ProcessingStatus.PROCESSING), [images]);
  const imagesToProcessCount = useMemo(() => 
    images.filter(img => img.status === ProcessingStatus.PENDING || img.status === ProcessingStatus.ERROR).length, 
    [images]
  );
  
  const canGenerate = useMemo(() => userCredits > 0, [userCredits]);

  useEffect(() => {
    const hydrateState = async () => {
        try {
            await initDB();
            const savedImageMetadata = localStorage.getItem('studio-shot-images');
            
            if (savedImageMetadata) {
                const parsedMetadata: SerializableProcessedImage[] = JSON.parse(savedImageMetadata);
                const rehydratedImages: (ProcessedImage | null)[] = await Promise.all(
                    parsedMetadata.map(async (meta) => {
                        const originalFile = await getItem<File>(meta.id);
                        if (!originalFile) return null;

                        let processedFile: File | undefined;
                        let processedDataUrl: string | undefined;

                        if (meta.status === ProcessingStatus.DONE && meta.processedFileName) {
                            processedFile = await getItem<File>(meta.id + '_processed');
                            if (processedFile) {
                                processedDataUrl = URL.createObjectURL(processedFile);
                            }
                        }

                        // Reset processing status on load
                        const initialStatus = meta.status === ProcessingStatus.PROCESSING ? ProcessingStatus.PENDING : meta.status;

                        return {
                            id: meta.id,
                            originalFile: originalFile,
                            originalDataUrl: URL.createObjectURL(originalFile),
                            processedFile: processedFile,
                            processedDataUrl: processedDataUrl,
                            status: initialStatus,
                            error: meta.error,
                            selected: false,
                        };
                    })
                );
                setImages(rehydratedImages.filter((img): img is ProcessedImage => img !== null));
            }
            
            const savedViewMode = localStorage.getItem('studio-shot-view-mode') as ViewMode;
            if (savedViewMode) setViewMode(savedViewMode);
            
            const savedTheme = localStorage.getItem('studio-shot-theme') as Theme;
            const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            setTheme(initialTheme);

        } catch (error) {
            console.error("Failed to hydrate state:", error);
        } finally {
            setIsHydrating(false);
        }
    };

    hydrateState();
  }, []);

  // Persist metadata to localStorage
  useEffect(() => {
    if (isHydrating) return;
    const serializableImages: SerializableProcessedImage[] = images.map(img => ({
      id: img.id,
      status: img.status,
      error: img.error,
      originalFileName: img.originalFile.name,
      processedFileName: img.processedFile?.name,
    }));
    localStorage.setItem('studio-shot-images', JSON.stringify(serializableImages));
  }, [images, isHydrating]);
  
  useEffect(() => {
    localStorage.setItem('studio-shot-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('studio-shot-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    return () => {
        imagesRef.current.forEach(image => {
            URL.revokeObjectURL(image.originalDataUrl);
            if(image.processedDataUrl) {
                URL.revokeObjectURL(image.processedDataUrl);
            }
        });
    };
  }, []);

  const processImage = useCallback(async (id: string) => {
    // --- Monetization Check ---
    if (!canGenerate) {
        alert("Du hast keine Credits mehr! Bitte kaufe mehr, um fortzufahren.");
        return;
    }
    // --- End Monetization Check ---

    const imageToProcess = imagesRef.current.find(img => img.id === id);
    if (!imageToProcess || imageToProcess.status === ProcessingStatus.PROCESSING || !imageToProcess.originalFile?.size) {
      if(!imageToProcess?.originalFile?.size) {
          setImages(prev => prev.map(img => img.id === id ? { ...img, status: ProcessingStatus.ERROR, error: 'Originaldatei fehlt oder ist leer. Bitte erneut hochladen.' } : img));
      }
      return;
    }
    
    setImages(prev => prev.map(img => img.id === id ? { ...img, status: ProcessingStatus.PROCESSING, error: undefined } : img));

    try {
      const { base64, mimeType } = await fileToBase64(imageToProcess.originalFile);
      
      // The API call now goes through our secure backend
      const transformedBase64 = await transformImage(base64, mimeType);
      
      const processedDataUrlString = `data:${mimeType};base64,${transformedBase64}`;
      const processedBlob = await dataUrlToBlob(processedDataUrlString);
      const processedFile = new File([processedBlob], `studio_${imageToProcess.originalFile.name}`, { type: mimeType });
      
      await setItem(id + '_processed', processedFile);

      // --- Decrement Credits ---
      setUserCredits(prev => prev - 1);
      // --- End Decrement Credits ---

      setImages(prev => prev.map(img => img.id === id ? {
        ...img,
        status: ProcessingStatus.DONE,
        processedDataUrl: URL.createObjectURL(processedFile),
        processedFile: processedFile
      } : img));
    } catch (error) {
      console.error('Error transforming image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
      setImages(prev => prev.map(img => img.id === id ? { ...img, status: ProcessingStatus.ERROR, error: errorMessage } : img));
    }
  }, [canGenerate]);

  const handleFilesSelected = async (files: FileList) => {
    const newImagesPromises = Array.from(files).map(async (file) => {
      const id = `${file.name}-${Date.now()}`;
      await setItem(id, file);
      return {
        id,
        originalFile: file,
        originalDataUrl: URL.createObjectURL(file),
        status: ProcessingStatus.PENDING,
        selected: false,
      };
    });
    const newImages = await Promise.all(newImagesPromises);
    setImages(prevImages => [...prevImages, ...newImages]);
  };

  const handleProcessAll = () => {
    const imagesToProcess = images.filter(img => 
        (img.status === ProcessingStatus.PENDING || img.status === ProcessingStatus.ERROR)
    );
    
    if (imagesToProcess.length > userCredits) {
        alert(`Du benötigst ${imagesToProcess.length} Credits, hast aber nur ${userCredits}.`);
        return;
    }

    imagesToProcess.forEach(img => processImage(img.id));
  };

  const handleToggleSelect = (id: string) => {
    setImages(images.map(img => img.id === id ? { ...img, selected: !img.selected } : img));
  };
  
  const handleToggleSelectAll = (select: boolean) => {
    setImages(images.map(img => ({...img, selected: select})));
  }

  const handleDeleteSelected = async () => {
     const remainingImages = images.filter(img => !img.selected);
     const removedImages = images.filter(img => img.selected);

     await Promise.all(removedImages.map(image => {
        URL.revokeObjectURL(image.originalDataUrl);
        if(image.processedDataUrl) {
            URL.revokeObjectURL(image.processedDataUrl);
        }
        return Promise.all([deleteItem(image.id), deleteItem(image.id + '_processed')]);
    }));

     setImages(remainingImages);
  };

  const handleDownloadSelectedZip = async () => {
    const zip = new JSZip();
    const imagesToDownload = images.filter(img => img.selected && img.status === ProcessingStatus.DONE && img.processedFile);
    
    if (imagesToDownload.length === 0) return;

    imagesToDownload.forEach(img => {
        if(img.processedFile) {
            zip.file(img.processedFile.name, img.processedFile);
        }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `Studio_Shots_${new Date().toISOString()}.zip`);
  };

  const handleThemeToggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const { selectedCount, selectedDoneCount, allSelected } = useMemo(() => {
    const selectedCount = images.filter(img => img.selected).length;
    const selectedDoneCount = images.filter(img => img.selected && img.status === ProcessingStatus.DONE).length;
    const allSelected = images.length > 0 && selectedCount === images.length;
    return { selectedCount, selectedDoneCount, allSelected };
  }, [images]);
  
  // --- Mock Auth Handlers ---
  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);
  const handleBuyCredits = () => alert("Dies würde in einer echten Anwendung zu einer Bezahlseite (z.B. Stripe) weiterleiten.");
  // --- End Mock Auth Handlers ---
  
  if (isHydrating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
        <AppLogo className="w-16 h-16 text-indigo-500 animate-pulse" />
        <h1 className="text-2xl font-bold mt-4">Bushyfam's Studio Shot</h1>
        <p className="mt-2">Dein Studio wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
      <Header 
        theme={theme} 
        onThemeToggle={handleThemeToggle} 
        isLoggedIn={isLoggedIn}
        credits={userCredits}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onBuyCredits={handleBuyCredits}
      />
      <main className="container mx-auto p-4 md:p-8">
        {!isLoggedIn ? (
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-12 border border-gray-200 dark:border-gray-700">
             <div className="text-center">
                <AppLogo className="w-20 h-20 text-indigo-500 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">Willkommen bei Studio Shot</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                    Bitte melden Sie sich an, um Ihre Produktbilder zu transformieren.
                </p>
                <button 
                  onClick={handleLogin}
                  className="mt-8 px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 text-lg"
                >
                  Anmelden / Registrieren
                </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <FileUploader onFilesSelected={handleFilesSelected} disabled={isProcessing} />
            </div>

            {images.length > 0 && (
                 <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700">
                        <div>
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    checked={allSelected}
                                    onChange={(e) => handleToggleSelectAll(e.target.checked)}
                                    aria-label="Alle Bilder auswählen"
                                />
                                <div className="font-semibold">
                                    {selectedCount > 0 ? `${selectedCount} ausgewählt` : `${images.length} Bilder`}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center flex-wrap gap-2">
                           {selectedCount > 0 && (
                            <>
                                <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900">
                                    <TrashIcon className="w-4 h-4" />
                                    <span>Löschen</span>
                                </button>
                                <button onClick={handleDownloadSelectedZip} disabled={selectedDoneCount === 0} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ZipIcon className="w-4 h-4" />
                                    <span>ZIP herunterladen ({selectedDoneCount})</span>
                                </button>
                            </>
                           )}
                           <div className="h-6 border-l border-gray-200 dark:border-gray-600 mx-2"></div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <ViewListIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/80 text-indigo-600 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                                    <ViewGridIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                     <div className="p-4">
                        <div className="flex justify-end items-center gap-4">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {imagesToProcessCount} bereit zum Generieren
                            </span>
                            <button
                                onClick={handleProcessAll}
                                disabled={isProcessing || imagesToProcessCount === 0 || !canGenerate}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                                title={!canGenerate && imagesToProcessCount > 0 ? "Nicht genügend Guthaben" : ""}
                            >
                                <SparklesIcon className="w-5 h-5" />
                                <span>Alle generieren</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className={`mt-8 grid gap-8 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
              {images.map(image => (
                viewMode === 'list' ? (
                  <ImageProcessor 
                    key={image.id}
                    image={image} 
                    onToggleSelect={() => handleToggleSelect(image.id)}
                    onProcess={processImage}
                    canGenerate={userCredits > 0}
                  />
                ) : (
                  <ImageGridItem
                    key={image.id}
                    image={image}
                    onToggleSelect={() => handleToggleSelect(image.id)}
                    onProcess={processImage}
                    canGenerate={userCredits > 0}
                  />
                )
              ))}
            </div>
            
            {images.length === 0 && (
                <div className="text-center py-16">
                    <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                    <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-300">Warteschlange ist leer</h3>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Fügen Sie einige Bilder hinzu, um mit der Umwandlung zu beginnen.</p>
                </div>
            )}

          </>
        )}
      </main>
    </div>
  );
};

export default App;
