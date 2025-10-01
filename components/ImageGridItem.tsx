import React from 'react';
import type { ProcessedImage } from '../types';
import { ProcessingStatus } from '../types';
import { CheckCircleIcon, ExclamationIcon, RefreshIcon, SparklesIcon } from './IconComponents';
import { Spinner } from './Spinner';

interface ImageGridItemProps {
  image: ProcessedImage;
  onToggleSelect: () => void;
  onProcess: (id: string) => void;
  canGenerate: boolean;
}

export const ImageGridItem: React.FC<ImageGridItemProps> = ({ image, onToggleSelect, onProcess, canGenerate }) => {
    const imageUrl = image.processedDataUrl || image.originalDataUrl;
    const showGenerateButton = canGenerate && (image.status === ProcessingStatus.PENDING || image.status === ProcessingStatus.ERROR);

    return (
        <div
            onClick={onToggleSelect}
            className={`relative aspect-square w-full rounded-lg shadow-md overflow-hidden cursor-pointer group transition-all duration-200 ${image.selected ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-offset-gray-900' : 'ring-0'}`}
        >
            <img src={imageUrl} alt={image.originalFile.name} className="w-full h-full object-cover"/>
            
            {image.status === ProcessingStatus.PROCESSING && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 rounded-lg"><Spinner /></div>}

            {image.selected && (
                 <div className="absolute inset-0 flex items-center justify-center bg-indigo-900 bg-opacity-60 rounded-lg">
                    <CheckCircleIcon className="w-12 h-12 text-white opacity-90"/>
                </div>
            )}
            
            {!image.selected && showGenerateButton && (
                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex flex-col items-center justify-center rounded-lg p-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onProcess(image.id);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-gray-800 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 transform scale-90 group-hover:scale-100 hover:bg-white"
                        aria-label={image.status === ProcessingStatus.PENDING ? 'Bild generieren' : 'Verarbeitung erneut versuchen'}
                    >
                        {image.status === ProcessingStatus.PENDING ? <SparklesIcon className="w-5 h-5 text-indigo-500"/> : <RefreshIcon className="w-5 h-5 text-yellow-600"/>}
                        {image.status === ProcessingStatus.PENDING ? 'Generieren' : 'Erneut versuchen'}
                    </button>
                 </div>
            )}

            {image.status === ProcessingStatus.ERROR && !image.selected && (
                <div title={image.error} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 group-hover:opacity-0 transition-opacity">
                    <ExclamationIcon className="w-4 h-4" />
                </div>
            )}
        </div>
    )
}