'use client';

import React, { lazy, Suspense, useState } from 'react';
import { History, BookmarkPlus, Check } from 'lucide-react';
import { ServiceNowResponse } from '@/types';
import { markdownComponents } from '@/lib/markdown-components';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import axios from 'axios';

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'));

interface ResultsSectionProps {
  response: ServiceNowResponse | null;
  error: string | null;
  isLoadedFromHistory: boolean;
  selectedType: string;
  question?: string;
}

export default function ResultsSection({ response, error, isLoadedFromHistory, selectedType, question }: ResultsSectionProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
        setSaveError(response_api.data.error || 'Failed to add to knowledge base');
      }
    } catch (error) {
      console.error('Error saving Q&A pair:', error);
      if (axios.isAxiosError(error)) {
        setSaveError(error.response?.data?.error || 'Failed to add to knowledge base');
      } else {
        setSaveError('An unexpected error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!response && !error) return null;

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-8 md:p-10 animate-in slide-in-from-bottom-4 duration-300">
      {/* History indicator */}
      {isLoadedFromHistory && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
          <History className="w-4 h-4" />
          <span>Loaded from conversation history</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-red-800 dark:text-red-300 font-medium">Error</span>
          </div>
          <p className="text-red-700 dark:text-red-400 mt-2">{error}</p>
        </div>
      )}

      {response && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-medium capitalize">{response.type || selectedType} Response</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 sm:p-8 shadow-inner border border-gray-100 dark:border-gray-600">
            <div className="prose prose-slate prose-base sm:prose-lg max-w-none 
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
              prose-table:border-collapse prose-table:w-full prose-table:border prose-table:border-gray-300 dark:prose-table:border-gray-600
              prose-th:bg-gray-100 dark:prose-th:bg-gray-700 prose-th:border prose-th:border-gray-300 dark:prose-th:border-gray-600 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold prose-th:text-gray-800 dark:prose-th:text-gray-200
              prose-td:border prose-td:border-gray-300 dark:prose-td:border-gray-600 prose-td:px-4 prose-td:py-2 prose-td:text-gray-700 dark:prose-td:text-gray-200">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading content...</span>
                </div>
              }>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                  components={markdownComponents}
                >
                  {response.message}
                </ReactMarkdown>
              </Suspense>
            </div>
          </div>
          
          {/* Add to Knowledge Base Button - show for all responses with questions */}
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
                    <BookmarkPlus className={`w-5 h-5 ${
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
                        ? "Found this helpful? Add it to the knowledge base for better future answers" 
                        : "Add this Q&A pair to the knowledge base for better answers"}
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
                    className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm ${
                      isSaved
                        ? 'bg-green-500 text-white cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md transform hover:scale-105'
                    } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isSaved ? 'Successfully added to knowledge base' : 'Add this Q&A pair to the knowledge base'}
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : isSaved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                    <span>
                      {isSaving ? 'Adding...' : isSaved ? 'Added!' : 'Add to knowledge base'}
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
                      Successfully added to knowledge base! This will help improve future responses.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}