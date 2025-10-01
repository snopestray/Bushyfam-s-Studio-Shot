
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './IconComponents';

interface FileUploaderProps {
  onFilesSelected: (files: FileList) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const baseClasses = "flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300";
  const idleClasses = "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600";
  const draggingClasses = "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50";
  const disabledClasses = "cursor-not-allowed bg-gray-200 dark:bg-gray-700 opacity-50";

  const getContainerClass = () => {
    if (disabled) return `${baseClasses} ${disabledClasses}`;
    if (isDragging) return `${baseClasses} ${draggingClasses}`;
    return `${baseClasses} ${idleClasses}`;
  };

  return (
    <div
      className={getContainerClass()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        id="file-upload"
        type="file"
        multiple
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
        <UploadIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">Zum Hochladen klicken</span> oder per Drag & Drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, oder WEBP</p>
      </label>
    </div>
  );
};