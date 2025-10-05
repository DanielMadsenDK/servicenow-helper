'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Download, FileText, FileDown, CheckCircle, AlertCircle } from 'lucide-react';
import { ExportFormat, ExportOptions } from '@/types';
import { getDefaultFilename, detectFileSystemAccess } from '@/lib/export-utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => Promise<void>;
  question?: string;
  answer: string;
  isExporting: boolean;
  error: string | null;
  success: boolean;
}

export default function ExportModal({
  isOpen,
  onClose,
  onExport,
  question,
  answer,
  isExporting,
  error,
  success,
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [filename, setFilename] = useState<string>(getDefaultFilename('markdown'));
  const [includeQuestion, setIncludeQuestion] = useState<boolean>(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const filenameInputRef = useRef<HTMLInputElement>(null);

  const hasFileSystemAccess = detectFileSystemAccess();

  // Update filename when format changes
  useEffect(() => {
    setFilename(getDefaultFilename(selectedFormat));
  }, [selectedFormat]);

  // Focus filename input when modal opens
  useEffect(() => {
    if (isOpen && filenameInputRef.current) {
      filenameInputRef.current.focus();
      // Select the filename without extension for easy editing
      const dotIndex = filename.lastIndexOf('.');
      if (dotIndex > 0) {
        filenameInputRef.current.setSelectionRange(0, dotIndex);
      }
    }
  }, [isOpen, filename]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isExporting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isExporting, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && !isExporting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isExporting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const exportOptions: ExportOptions = {
      format: selectedFormat,
      filename,
      includeQuestion,
      question,
      answer,
    };

    await onExport(exportOptions);
  };

  const handleCancel = () => {
    if (!isExporting) {
      setSelectedFormat('markdown');
      setFilename(getDefaultFilename('markdown'));
      setIncludeQuestion(true);
      onClose();
    }
  };

  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-md my-8 mx-auto"
        style={{
          position: 'relative',
          top: 'auto',
          left: 'auto',
          transform: 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Export Answer
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Close"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-800 dark:text-green-200 text-sm">
                Answer exported successfully!
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
            </div>
          )}

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Format <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Markdown Option */}
              <button
                type="button"
                onClick={() => handleFormatChange('markdown')}
                disabled={isExporting}
                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                  selectedFormat === 'markdown'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-pressed={selectedFormat === 'markdown'}
                aria-label="Export as Markdown"
              >
                <FileText className={`w-8 h-8 mb-2 ${
                  selectedFormat === 'markdown'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'markdown'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Markdown
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  .md file
                </span>
              </button>

              {/* PDF Option */}
              <button
                type="button"
                onClick={() => handleFormatChange('pdf')}
                disabled={isExporting}
                className={`flex flex-col items-center p-4 border-2 rounded-xl transition-all ${
                  selectedFormat === 'pdf'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-700'
                } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                aria-pressed={selectedFormat === 'pdf'}
                aria-label="Export as PDF"
              >
                <FileDown className={`w-8 h-8 mb-2 ${
                  selectedFormat === 'pdf'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`} />
                <span className={`font-medium ${
                  selectedFormat === 'pdf'
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  PDF
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  .pdf file
                </span>
              </button>
            </div>
          </div>

          {/* Filename Input */}
          <div>
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filename <span className="text-red-500">*</span>
            </label>
            <input
              ref={filenameInputRef}
              type="text"
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              disabled={isExporting}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={`ServiceNow-Helper-${new Date().toISOString().slice(0, 10)}`}
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Enter the filename for your export
            </p>
          </div>

          {/* Include Question Checkbox */}
          {question && (
            <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <input
                type="checkbox"
                id="includeQuestion"
                checked={includeQuestion}
                onChange={(e) => setIncludeQuestion(e.target.checked)}
                disabled={isExporting}
                className="mt-0.5 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 dark:bg-gray-600 dark:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <label htmlFor="includeQuestion" className="flex-1 cursor-pointer">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Question
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Export both the question and answer together
                </span>
              </label>
            </div>
          )}

          {/* File System Access API Info */}
          {!hasFileSystemAccess && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Your browser doesn&apos;t support file picker dialogs. The file will be downloaded to your default Downloads folder.
              </p>
            </div>
          )}

          {hasFileSystemAccess && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <strong>Tip:</strong> You&apos;ll be able to choose where to save the file.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isExporting}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting || !filename.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
