'use client';

import React, { useState, memo } from 'react';
import { History, Database, Check, Download, BotMessageSquare } from 'lucide-react';
import axios from 'axios';

import { ServiceNowResponse, StreamingStatus, ExportOptions } from '@/types';
import { exportAnswer } from '@/lib/export-utils';

import StreamingMarkdownRenderer from './StreamingMarkdownRenderer';
import ExportModal from './ExportModal';

interface ResultsSectionProps {
  response: ServiceNowResponse | null;
  error: string | null;
  isLoadedFromHistory: boolean;
  selectedType: string;
  question?: string;
  streamingContent?: string;
  isStreaming?: boolean;
  streamingStatus?: StreamingStatus;
}

// Custom comparison function for React.memo
// Returns true if props are EQUAL (skip re-render), false if DIFFERENT (do re-render)
const areResultsEqual = (prevProps: ResultsSectionProps, nextProps: ResultsSectionProps): boolean => {
  // Compare all props that affect rendering
  // With the architecture fixes in place (memoized components, no StreamingContext),
  // streamingContent changes won't cause unnecessary cascading re-renders
  if (prevProps.response?.message !== nextProps.response?.message) return false;
  if (prevProps.response?.type !== nextProps.response?.type) return false;
  if (prevProps.error !== nextProps.error) return false;
  if (prevProps.isLoadedFromHistory !== nextProps.isLoadedFromHistory) return false;
  if (prevProps.selectedType !== nextProps.selectedType) return false;
  if (prevProps.question !== nextProps.question) return false;
  if (prevProps.streamingContent !== nextProps.streamingContent) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.streamingStatus !== nextProps.streamingStatus) return false;
  return true;
};

const ResultsSection = memo(function ResultsSection({
  response,
  error,
  isLoadedFromHistory,
  selectedType,
  question,
  streamingContent = '',
  isStreaming = false,
  streamingStatus = StreamingStatus.CONNECTING
}: ResultsSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Export state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleSaveQA = async () => {
    if (!response || !question) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const saveData = {
        question: question.trim(),
        answer: response.message,
        category: selectedType,
        tags: [selectedType]
      };

      const response_api = await axios.post('/api/save-qa-pair', saveData);

      if (response_api.data.success) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Reset after 3 seconds
      } else {
        setSaveError(response_api.data.error || 'Failed to add to Knowledge Store');
      }
    } catch (error) {
      console.error('Error saving Q&A pair:', error);
      if (axios.isAxiosError(error)) {
        setSaveError(error.response?.data?.error || 'Failed to add to Knowledge Store');
      } else {
        setSaveError('An unexpected error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      await exportAnswer(options);
      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        setIsExportModalOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Error exporting answer:', error);
      if ((error as Error).message === 'Save cancelled by user') {
        // User cancelled, just close modal
        setIsExportModalOpen(false);
      } else {
        setExportError((error as Error).message || 'Failed to export answer');
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Show streaming content or regular response
  const hasContent = response || error || (isStreaming && streamingContent);
  if (!hasContent) return null;

  // Determine what content to show
  const displayContent = isStreaming ? streamingContent : response?.message;
  const showStreamingIndicators = isStreaming && streamingStatus !== StreamingStatus.COMPLETE;

  return (
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 border border-blue-200/50 dark:border-blue-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header with Response Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-b border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {isStreaming ? 'AI Response' : `${(response?.type || selectedType).charAt(0).toUpperCase() + (response?.type || selectedType).slice(1)} Response`}
            </span>

            {/* History badge in header */}
            {isLoadedFromHistory && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 rounded-full">
                <History className="w-3 h-3 flex-shrink-0" />
                History
              </span>
            )}

            {/* Streaming status indicator in header */}
            {showStreamingIndicators && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                <div className="flex space-x-0.5">
                  <div className="w-1 h-1 bg-blue-500 rounded-full streaming-dots" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full streaming-dots" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full streaming-dots" style={{ animationDelay: '300ms' }}></div>
                </div>
                {streamingStatus === StreamingStatus.CONNECTING && 'Connecting...'}
                {streamingStatus === StreamingStatus.STREAMING && 'Streaming...'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Export button in header */}
            {response && !isStreaming && (
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                title="Export answer as Markdown or PDF"
                aria-label="Export answer as Markdown or PDF"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
          {/* Error display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 shadow-sm mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-800 dark:text-red-300 font-medium">Error</span>
              </div>
              <p className="text-red-700 dark:text-red-400 mt-2">{error}</p>
            </div>
          )}

          {/* Response content */}
          {(response || (isStreaming && displayContent)) && (
            <div className="space-y-4">
              <StreamingMarkdownRenderer
                content={displayContent || ''}
                isStreaming={isStreaming}
                showStreamingCursor={showStreamingIndicators}
                className="prose prose-slate prose-base sm:prose-lg max-w-none wrap-break-word break-words
                  prose-headings:text-slate-800 dark:prose-headings:text-slate-200 prose-headings:font-semibold prose-headings:tracking-tight
                  prose-h1:text-2xl sm:prose-h1:text-3xl prose-h1:mb-4 sm:prose-h1:mb-6 prose-h1:mt-6 sm:prose-h1:mt-8 prose-h1:border-b prose-h1:border-gray-200 dark:prose-h1:border-gray-600 prose-h1:pb-2 sm:prose-h1:pb-3
                  prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mb-3 sm:prose-h2:mb-4 prose-h2:mt-6 sm:prose-h2:mt-8 prose-h2:text-blue-800 dark:prose-h2:text-blue-300 prose-h2:border-l-4 prose-h2:border-blue-500 prose-h2:pl-3 sm:prose-h2:pl-4 prose-h2:bg-blue-50/50 dark:prose-h2:bg-blue-900/30 prose-h2:py-2 prose-h2:rounded-r-lg
                  prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mb-2 sm:prose-h3:mb-3 prose-h3:mt-4 sm:prose-h3:mt-6 prose-h3:text-green-700 dark:prose-h3:text-green-400 prose-h3:font-medium
                  prose-h4:text-base sm:prose-h4:text-lg prose-h4:mb-2 prose-h4:mt-3 sm:prose-h4:mt-4 prose-h4:text-gray-700 dark:prose-h4:text-gray-300 prose-h4:font-medium
                  prose-p:text-gray-700 dark:prose-p:text-gray-200 prose-p:leading-relaxed prose-p:mb-3 sm:prose-p:mb-4
                  prose-strong:text-slate-800 dark:prose-strong:text-slate-200 prose-strong:font-semibold
                  prose-em:text-slate-600 dark:prose-em:text-slate-400 prose-em:italic
                  prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:bg-purple-100 dark:prose-code:bg-purple-900/30 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:font-medium prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:shadow-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/30 prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-blue-800 dark:prose-blockquote:text-blue-300
                  prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-a:underline prose-a:decoration-blue-300 prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-blue-800 dark:hover:prose-a:text-blue-300 hover:prose-a:decoration-blue-500
                  prose-li:text-gray-700 dark:prose-li:text-gray-200 prose-li:mb-2 prose-li:leading-relaxed
                  prose-ul:space-y-2 prose-ol:space-y-2
                  prose-ul>li:relative prose-ul>li:pl-1
                  prose-ol>li:relative prose-ol>li:pl-1
                  prose-table:border-separate prose-table:border-spacing-2 prose-table:w-full prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600 prose-table:rounded-lg
                  prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:px-8 prose-th:py-4 prose-th:text-left prose-th:font-semibold prose-th:text-gray-800 dark:prose-th:text-gray-200
                  prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-8 prose-td:py-4 prose-td:text-gray-700 dark:prose-td:text-gray-200"
              />

              {/* Add to Knowledge Store Button - show for all responses with questions */}
              {question && (
                <div className={`mt-6 p-4 rounded-xl border ${
                  isLoadedFromHistory
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-700/50'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700/50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isLoadedFromHistory
                          ? 'bg-amber-100 dark:bg-amber-800/50'
                          : 'bg-blue-100 dark:bg-blue-800/50'
                      }`}>
                        <Database className={`w-5 h-5 ${
                          isLoadedFromHistory
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          Help improve future responses
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {isLoadedFromHistory
                            ? "Found this helpful? Add it to the Knowledge Store for better future answers"
                            : "Add this Q&A pair to the Knowledge Store for better answers"}
                        </p>
                        {isLoadedFromHistory && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            From conversation history
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleSaveQA}
                        disabled={isSaving || isSaved}
                        className={`flex items-center gap-2.5 min-h-[44px] px-6 py-3 rounded-full font-medium transition-all duration-200 shadow-md ${
                          isSaved
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white cursor-default shadow-green-500/25'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white hover:shadow-lg hover:shadow-blue-500/30 hover:scale-105 active:scale-95'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isSaved ? 'Successfully added to Knowledge Store' : 'Add this Q&A pair to the Knowledge Store'}
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : isSaved ? (
                          <Check className="w-5 h-5 flex-shrink-0" />
                        ) : (
                          <Database className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="text-sm sm:text-base">
                          {isSaving ? 'Adding...' : isSaved ? 'Added!' : 'Add to Knowledge Store'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {saveError && (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-red-700 dark:text-red-400 text-sm font-medium">
                          {saveError}
                        </span>
                      </div>
                    </div>
                  )}

                  {isSaved && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                          Successfully added to Knowledge Store! This will help improve future responses.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        question={question}
        answer={displayContent || ''}
        isExporting={isExporting}
        error={exportError}
        success={exportSuccess}
      />
    </div>
  );
}, areResultsEqual);

ResultsSection.displayName = 'ResultsSection';

export default ResultsSection;
