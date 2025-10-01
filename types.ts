export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  ERROR = 'error',
}

export interface ProcessedImage {
  id: string;
  originalFile: File;
  originalDataUrl: string;
  processedFile?: File;
  processedDataUrl?: string;
  status: ProcessingStatus;
  error?: string;
  selected?: boolean;
}