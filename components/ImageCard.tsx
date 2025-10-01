import React from 'react';
import { ProcessingStatus } from '../types';
import { DownloadIcon, ExclamationIcon, ImageIcon, RefreshIcon, SparklesIcon } from './IconComponents';
import { Spinner } from './Spinner';

interface ImageCardProps {
  title: string;
  imageUrl?: string;
  status?: ProcessingStatus;
  fileName?: string;
  error?: string;
  onProcess?: () => void;
  canGenerate?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({ title, imageUrl, status, fileName, error, onProcess, canGenerate }) => {
  const handleDownload = () => {
    if (!imageUrl || !fileName) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    switch (status) {
      case ProcessingStatus.PROCESSING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg">
            <Spinner />
            <p className="text-white mt-2 text-sm font-medium">Wird verbessert...</p>
          </div>
        );
      case ProcessingStatus.ERROR:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500 bg-opacity-70 rounded-lg p-4 text-center">
            <ExclamationIcon className="w-8 h-8 text-white mb-2"/>
            <p className="text-white text-sm font-semibold">Fehler</p>
            <p className="text-white text-xs mt-1">{error}</p>
          </div>
        );
      case ProcessingStatus.DONE:
        if (imageUrl) {
          return <img src={imageUrl} alt={title} className="w-full h-full object-contain" />;
        }
      case ProcessingStatus.PENDING:
      default:
        if (imageUrl) {
          return <img src={imageUrl} alt={title} className="w-full h-full object-contain" />;
        }
        return (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-lg">
            <ImageIcon className="w-12 h-12" />
            <span className="mt-2 text-sm">Wartet auf Generierung</span>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">{title}</h4>
        <div className="relative aspect-square w-full bg-white dark:bg-gray-900/50 rounded-lg shadow-inner overflow-hidden border border-gray-200 dark:border-gray-700">
            {renderContent()}
        </div>
        <div className="h-14 mt-2 flex items-center justify-center px-2">
            {status === ProcessingStatus.DONE && imageUrl && fileName && (
                <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors duration-200"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Herunterladen</span>
                </button>
            )}
            {status === ProcessingStatus.PENDING && onProcess && (
                 <button
                    onClick={onProcess}
                    disabled={!canGenerate}
                    className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"
                    title={!canGenerate ? "Kein Guthaben" : ""}
                >
                    <SparklesIcon className="w-4 h-4" />
                    <span>Generieren</span>
                </button>
            )}
            {status === ProcessingStatus.ERROR && onProcess && (
                 <button
                    onClick={onProcess}
                    disabled={!canGenerate}
                    className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition-colors duration-200 disabled:bg-yellow-300 dark:disabled:bg-yellow-800 disabled:cursor-not-allowed"
                    title={!canGenerate ? "Kein Guthaben" : ""}
                >
                    <RefreshIcon className="w-4 h-4" />
                    <span>Erneut versuchen</span>
                </button>
            )}
            {fileName && ![ProcessingStatus.DONE, ProcessingStatus.PENDING, ProcessingStatus.ERROR].includes(status) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate">{fileName}</p>
            )}
             {status === ProcessingStatus.PENDING && !onProcess && (
                 <p className="text-xs text-gray-500 dark:text-gray-400 text-center truncate">{fileName}</p>
            )}
        </div>
    </div>
  );
};