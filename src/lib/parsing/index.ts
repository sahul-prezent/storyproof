import { parsePptx } from './pptx-parser';
import { parsePdf } from './pdf-parser';
import type { ParsedPresentation } from '@/types/presentation';

export type SupportedFileType = 'pptx' | 'pdf';

const MIME_TYPES: Record<string, SupportedFileType> = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/pdf': 'pdf',
};

const EXTENSIONS: Record<string, SupportedFileType> = {
  '.pptx': 'pptx',
  '.pdf': 'pdf',
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function detectFileType(
  fileName: string,
  mimeType?: string
): SupportedFileType | null {
  if (mimeType && MIME_TYPES[mimeType]) {
    return MIME_TYPES[mimeType];
  }
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return EXTENSIONS[ext] || null;
}

export function validateFile(
  fileName: string,
  fileSize: number,
  mimeType?: string
): { valid: boolean; error?: string; fileType?: SupportedFileType } {
  const fileType = detectFileType(fileName, mimeType);

  if (!fileType) {
    return { valid: false, error: 'Unsupported file type. Please upload a .pptx or .pdf file.' };
  }

  if (fileSize > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 50MB.' };
  }

  if (fileSize === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  return { valid: true, fileType };
}

export async function parsePresentation(
  buffer: Buffer,
  fileName: string,
  fileType: SupportedFileType
): Promise<ParsedPresentation> {
  switch (fileType) {
    case 'pptx':
      return parsePptx(buffer, fileName);
    case 'pdf':
      return parsePdf(buffer, fileName);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

export { parsePptx } from './pptx-parser';
export { parsePdf } from './pdf-parser';
