'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/pdf': ['.pdf'],
};

const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const GRADIENT = 'linear-gradient(90deg, #21A7E0 0%, #68FFEB 26%, #93FFA2 40%, #FFD769 57%, #FF9B3E 70%, #FF9143 89%)';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function Dropzone({ onFileSelected, disabled }: DropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: { errors: readonly { message: string }[] }[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        if (err.message.includes('file-too-large')) {
          setError('File too large. Maximum size is 50MB.');
        } else {
          setError('Please upload a .pptx or .pdf file.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError(null);
  };

  const isActive = isDragActive || (selectedFile && !error);

  return (
    <div className="w-full">
      {/* Outer wrapper provides the gradient border */}
      <div
        className={cn(
          'rounded-2xl p-[2px] transition-all',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          background: isActive || error
            ? (error ? '#EF4444' : GRADIENT)
            : 'rgba(255,255,255,0.15)',
        }}
      >
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-[14px] bg-[#0B1D3A] p-10 transition-all cursor-pointer',
            'hover:bg-[#0f2545]',
            isDragActive && 'bg-[#112D4E] scale-[1.01]',
          )}
          // Apply gradient border on hover via inline style
          onMouseEnter={(e) => {
            if (!isActive && !error) {
              (e.currentTarget.parentElement as HTMLElement).style.background = GRADIENT;
            }
          }}
          onMouseLeave={(e) => {
            if (!isActive && !error) {
              (e.currentTarget.parentElement as HTMLElement).style.background = 'rgba(255,255,255,0.15)';
            }
          }}
        >
          <input {...getInputProps()} />

          {selectedFile && !error ? (
            <div className="flex items-center gap-4">
              <FileText className="h-9 w-9 text-[#21A7E0]" />
              <div className="text-left">
                <p className="font-medium text-base text-white">{selectedFile.name}</p>
                <p className="text-sm text-[#94A3B8]">
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={clearFile}
                className="ml-2 p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="h-5 w-5 text-[#94A3B8]" />
              </button>
            </div>
          ) : (
            <>
              <Upload
                className={cn(
                  'h-12 w-12 mb-4',
                  isDragActive ? 'text-white' : 'text-[#94A3B8]'
                )}
              />
              <p className="text-base font-medium mb-1.5 text-white">
                {isDragActive
                  ? 'Drop your presentation here'
                  : 'Drag & drop your presentation'}
              </p>
              <p className="text-sm text-[#94A3B8]">
                or click to browse — .pptx or .pdf, up to 50MB
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
