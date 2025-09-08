export interface UploadedFile {
  id: string;
  sessionId: string;
  filename: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  status: string;
  uploadedAt: Date;
}

export interface FileConversion {
  id: string;
  fileId: string;
  conversionType: string;
  options: ConversionOptions;
  jsonOutput?: any;
  tokenCount?: number;
  status: string;
  error?: string;
  createdAt: Date;
}

export interface ConversionOptions {
  includeTables: boolean;
  includeImages: boolean;
  preserveFormatting: boolean;
}

export interface ProcessedFile extends UploadedFile {
  conversions: FileConversion[];
  latestConversion?: FileConversion;
}

export type ConversionType = 'summary' | 'full_content' | 'metadata_only';

export interface FileTypeInfo {
  extension: string;
  icon: string;
  color: string;
  accept: string;
}

export const FILE_TYPES: Record<string, FileTypeInfo> = {
  pdf: { extension: 'PDF', icon: 'fas fa-file-pdf', color: 'text-red-500', accept: '.pdf' },
  docx: { extension: 'DOCX', icon: 'fas fa-file-word', color: 'text-blue-500', accept: '.docx' },
  txt: { extension: 'TXT', icon: 'fas fa-file-alt', color: 'text-gray-500', accept: '.txt' },
  md: { extension: 'MD', icon: 'fas fa-file-alt', color: 'text-purple-500', accept: '.md' },
  csv: { extension: 'CSV', icon: 'fas fa-file-csv', color: 'text-green-500', accept: '.csv' },
  json: { extension: 'JSON', icon: 'fas fa-file-code', color: 'text-yellow-500', accept: '.json' },
  xml: { extension: 'XML', icon: 'fas fa-file-code', color: 'text-orange-500', accept: '.xml' }
};
