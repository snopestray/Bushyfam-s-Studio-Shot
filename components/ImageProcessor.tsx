import React from 'react';
import type { ProcessedImage } from '../types';
import { ProcessingStatus } from '../types';
import { ImageCard } from './ImageCard';
import { ArrowRightIcon } from './IconComponents';
import { ImageComparator } from './ImageComparator';

interface ImageProcessorProps {
  image: ProcessedImage;
  onToggleSelect: () => void;
  onProcess: (id: string) => void;
  canGenerate: boolean;
}

export const ImageProcessor: React.FC<ImageProcessorProps> = ({ image, onToggleSelect, onProcess, canGenerate }) => {

  if (image.status === ProcessingStatus.DONE && image.processedDataUrl) {
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="absolute top-4 left-4 z-10">
                <input
                    type="checkbox"
                    checked={!!image.selected}
                    onChange={onToggleSelect}
                    className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
            </div>
            <ImageComparator
                original={image.originalDataUrl}
                processed={image.processedDataUrl}
                originalFileName={image.originalFile.name}
                processedFileName={image.processedFile?.name}
            />
        </div>
    );
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="absolute top-4 left-4 z-10">
        <input
            type="checkbox"
            checked={!!image.selected}
            onChange={onToggleSelect}
            className="h-6 w-6 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
        />
      </div>
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <div className="w-full md:w-5/12">
            <ImageCard
                title="Original"
                imageUrl={image.originalDataUrl}
                fileName={image.originalFile.name}
            />
        </div>
        <div className="flex-shrink-0 my-4 md:my-0 text-indigo-500 dark:text-indigo-400">
             <ArrowRightIcon className="w-10 h-10" />
        </div>

        <div className="w-full md:w-5/12">
            <ImageCard
                title="Studio-Qualität"
                imageUrl={image.processedDataUrl}
                status={image.status}
                fileName={image.processedFile?.name}
                error={image.error}
                onProcess={() => onProcess(image.id)}
                canGenerate={canGenerate}
            />
        </div>
      </div>
    </div>
  );
};