'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, Headphones, Paperclip, AlertCircle } from 'lucide-react';
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
      {/* File Upload Area */}
      {!fileInfo && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={getSupportedMimeTypes().join(',')}
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center space-y-2">
            <Upload className={`w-8 h-8 ${
              isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
            }`} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Drop a file here or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Supports: {getSupportedTypesDisplay()} (max 10MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selected File Display */}
      {fileInfo && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {React.createElement(getFileIcon(fileInfo.type), {
                  className: "w-5 h-5 text-blue-600 dark:text-blue-400"
                })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {fileInfo.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(fileInfo.size)} • {getFileTypeFromMime(fileInfo.type)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Capability Icons Legend */}
      {capabilities.length > 0 && (
        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Paperclip className="w-3 h-3" />
            <span>Supported:</span>
          </div>
          {capabilities.map((cap) => {
            const IconComponent = cap.name === 'text' ? FileText : 
                                 cap.name === 'images' ? Image : 
                                 cap.name === 'audio' ? Headphones : FileText;
            return (
              <div key={cap.id} className="flex items-center space-x-1">
                <IconComponent className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>{cap.display_name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}