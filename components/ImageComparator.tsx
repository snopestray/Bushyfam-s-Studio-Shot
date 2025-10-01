import React, { useState, useRef, useCallback } from 'react';
import { DownloadIcon } from './IconComponents';

interface ImageComparatorProps {
  original: string;
  processed: string;
  originalFileName?: string;
  processedFileName?: string;
}

export const ImageComparator: React.FC<ImageComparatorProps> = ({ original, processed, originalFileName, processedFileName }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newPosition = ((clientX - rect.left) / rect.width) * 100;
    newPosition = Math.max(0, Math.min(100, newPosition));
    setSliderPosition(newPosition);
  }, []);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
  };
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = processed;
    link.download = processedFileName || 'studio_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full text-center">
        <div className="flex justify-between items-center mb-2 px-2">
            <div className="text-left">
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Vergleich</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-xs" title={originalFileName}>{originalFileName || 'Original'}</p>
            </div>
            <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-200"
            >
                <DownloadIcon className="w-4 h-4" />
                <span>Ergebnis herunterladen</span>
            </button>
        </div>
      <div
        ref={containerRef}
        className="relative w-full aspect-square rounded-lg shadow-inner overflow-hidden select-none cursor-ew-resize border border-gray-200 dark:border-gray-700"
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        <img src={original} alt="Original" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        <div
          className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={processed} alt="Processed" className="w-full h-full object-contain" />
        </div>
        <div
            className="absolute top-0 bottom-0 bg-white w-1 cursor-ew-resize"
            style={{ left: `calc(${sliderPosition}% - 2px)` }}
        >
          <div 
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-white shadow-lg border-2 border-indigo-500 flex items-center justify-center"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            >
            <div className="text-indigo-500 transform rotate-90">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg>
            </div>
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded pointer-events-none">Original</div>
        <div 
            className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded pointer-events-none"
            style={{ opacity: sliderPosition > 60 ? 1 : 0, transition: 'opacity 0.2s' }}
        >
            Studio
        </div>
      </div>
    </div>
  );
};