'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Paperclip, X, FileText, Image, Headphones, AlertCircle } from 'lucide-react';
import type { Capability } from '@/types/index';

interface FileUploadProps {
  onFileSelect: (file: string | null) => void;
  capabilities: Capability[];
  disabled?: boolean;
}

interface FileInfo {
  name: string;
  type: string;
  size: number;
  data: string;
}

export default function FileUpload({ onFileSelect, capabilities, disabled }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSupportedMimeTypes = useCallback(() => {
    const mimeTypes: string[] = [];
    
    capabilities.forEach(cap => {
      switch (cap.name) {
        case 'text':
          mimeTypes.push('text/plain', 'text/markdown', 'text/csv', 'application/json');
          break;
        case 'images':
          mimeTypes.push('image/png', 'image/jpeg', 'image/gif', 'image/webp');
          break;
        case 'audio':
          mimeTypes.push('audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/webm');
          break;
      }
    });
    
    return mimeTypes;
  }, [capabilities]);

  const getFileTypeFromMime = useCallback((mimeType: string): string => {
    if (mimeType.startsWith('text/') || mimeType === 'application/json') return 'text';
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'unknown';
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    const supportedMimeTypes = getSupportedMimeTypes();
    
    if (!supportedMimeTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported. Supported types: ${supportedMimeTypes.join(', ')}`;
    }
    
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return 'File size must be less than 10MB';
    }
    
    return null;
  }, [getSupportedMimeTypes]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          // Remove the data URL prefix to get just the base64 data
          const base64Data = result.split(',')[1];
          
          const newFileInfo: FileInfo = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64Data
          };
          
          setFileInfo(newFileInfo);
          onFileSelect(base64Data);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process file');
      console.error('File processing error:', err);
    }
  }, [validateFile, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleRemoveFile = useCallback(() => {
    setFileInfo(null);
    setError(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileSelect]);

  const getFileIcon = useCallback((type: string) => {
    const fileType = getFileTypeFromMime(type);
    switch (fileType) {
      case 'text':
        return FileText;
      case 'images':
        return Image;
      case 'audio':
        return Headphones;
      default:
        return FileText;
    }
  }, [getFileTypeFromMime]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getSupportedTypesDisplay = useCallback(() => {
    const types: string[] = [];
    capabilities.forEach(cap => {
      switch (cap.name) {
        case 'text':
          types.push('Text files');
          break;
        case 'images':
          types.push('Images');
          break;
        case 'audio':
          types.push('Audio files');
          break;
      }
    });
    return types.join(', ');
  }, [capabilities]);

  if (capabilities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* File Upload Button - Styled to match ToggleControls */}
      {!fileInfo && (
        <div
          className={`grid grid-cols-1 sm:grid-cols-1 gap-3 sm:gap-4 ${disabled ? 'pointer-events-none' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={getSupportedMimeTypes().join(',')}
            disabled={disabled}
          />
          
          <button
            type="button"
            onClick={() => !disabled && fileInputRef.current?.click()}
            disabled={disabled}
            className={`flex items-center px-4 py-2 sm:px-6 sm:py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 transition-all duration-200 shadow-sm w-full transform ${
              disabled 
                ? 'opacity-60 cursor-not-allowed scale-95' 
                : isDragging
                ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                : 'hover:border-blue-300 dark:hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md hover:scale-102 hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center space-x-2 sm:space-x-3 w-full">
              <Paperclip className={`w-5 h-5 ${
                isDragging ? 'text-blue-500' : 'text-gray-600 dark:text-gray-400'
              }`} />
              <div className="flex-1 text-left">
                <span className={`font-medium text-sm sm:text-base ${
                  isDragging ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {isDragging ? 'Drop file here' : 'Attach File'}
                </span>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {getSupportedTypesDisplay()} • Max 10MB
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Selected File Chip */}
      {fileInfo && (
        <div className="inline-flex items-center max-w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-3 py-2 shadow-sm">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="flex-shrink-0">
              {React.createElement(getFileIcon(fileInfo.type), {
                className: "w-4 h-4 text-blue-600 dark:text-blue-400"
              })}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">
                {fileInfo.name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                {formatFileSize(fileInfo.size)}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="flex-shrink-0 ml-2 p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/50 transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start space-x-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}
    </div>
  );
}