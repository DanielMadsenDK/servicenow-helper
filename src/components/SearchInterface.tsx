'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { History } from 'lucide-react';
import { ServiceNowResponse, ConversationHistoryItem, StreamingRequest, StreamingChunk, StreamingStatus } from '@/types';
import { cancelRequest, submitQuestionStreaming } from '@/lib/api';
import { StreamingClient } from '@/lib/streaming-client';
import { streamingCancellation } from '@/lib/streaming-cancellation';
import BurgerMenu from './BurgerMenu';
import ThemeToggle from './ThemeToggle';
import WelcomeSection from './WelcomeSection';
import ProcessingOverlay from './ProcessingOverlay';
import QuestionInput from './QuestionInput';
import TypeSelector from './TypeSelector';
import ToggleControls from './ToggleControls';
import SubmitButton from './SubmitButton';
import ResultsSection from './ResultsSection';
import Footer from './Footer';
import { useSettings } from '@/contexts/SettingsContext';
import { useAIModels } from '@/contexts/AIModelContext';
import { usePlaceholderRotation } from '@/hooks/usePlaceholderRotation';
import { useSessionManager } from '@/hooks/useSessionManager';
import { RequestType } from '@/lib/constants';
import FileUpload from './FileUpload';

// Lazy load heavy components
const HistoryPanel = lazy(() => import('./HistoryPanel'));

export default function SearchInterface() {
  const { settings, updateSetting } = useSettings();
  const { models } = useAIModels();
  const [question, setQuestion] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<RequestType>(settings.default_request_type);
  const [searchMode, setSearchMode] = useState(settings.default_search_mode);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ServiceNowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [streamingClient, setStreamingClient] = useState<StreamingClient | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>(StreamingStatus.CONNECTING);
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasScrolledToResults, setHasScrolledToResults] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false);
  const [isWelcomeSectionVisible, setIsWelcomeSectionVisible] = useState(settings.welcome_section_visible);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { continueMode, setContinueMode, getSessionKey, currentSessionKey } = useSessionManager();
  const currentPlaceholder = usePlaceholderRotation({ textareaRef, question });

  // Optimized smooth scroll function
  const smoothScrollToResults = () => {
    const targetElement = resultsRef.current;
    if (targetElement) {
      // Use optimized scroll with shorter duration for better performance
      const targetTop = targetElement.offsetTop - 32; // Account for padding
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    }
  };

  // Get current model and check if it's multimodal
  const getCurrentModel = () => {
    return models.find(m => m.model_name === settings.default_ai_model);
  };

  const isCurrentModelMultimodal = () => {
    const currentModel = getCurrentModel();
    return currentModel && currentModel.capabilities && currentModel.capabilities.length > 0;
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Sync with settings changes
  useEffect(() => {
    setSelectedType(settings.default_request_type);
    setSearchMode(settings.default_search_mode);
    setIsWelcomeSectionVisible(settings.welcome_section_visible);
  }, [settings]);

  // Scroll to results when response is available (both new responses and history items)
  useEffect(() => {
    if (response && resultsRef.current) {
      // Different delays: shorter for history (no API wait), longer for new responses (lazy-loaded ReactMarkdown)
      const delay = isLoadedFromHistory ? 100 : 500;
      setTimeout(() => {
        smoothScrollToResults();
      }, delay);
    }
  }, [response, isLoadedFromHistory]);

  // Scroll to results when streaming starts is now handled in onChunk callback

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!question.trim()) return;

    // Reset states for new submission
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setIsLoadedFromHistory(false);
    setStreamingContent('');
    setIsStreaming(true);
    setHasScrolledToResults(false);

    const sessionKey = getSessionKey();

    const request: StreamingRequest = {
      question: question.trim(),
      type: selectedType,
      sessionkey: sessionKey,
      searching: searchMode,
      aiModel: settings.default_ai_model,
      ...(selectedFile && { file: selectedFile }),
    };

    try {
      const client = await submitQuestionStreaming(request, {
        onChunk: (chunk: StreamingChunk) => {
          setStreamingContent(prev => {
            const newContent = prev + chunk.content;
            // Scroll to results on first chunk (when content starts appearing)
            if (!hasScrolledToResults && newContent.length > 0 && resultsRef.current) {
              setTimeout(() => {
                smoothScrollToResults();
              }, 100);
              setHasScrolledToResults(true);
            }
            return newContent;
          });
        },
        
        onComplete: (totalContent: string) => {
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingClient(null);
          setHasScrolledToResults(false);
          
          // Cleanup cancellation manager
          streamingCancellation.cleanupSession(sessionKey);
          
          // Create a ServiceNowResponse for compatibility with existing components
          const finalResponse: ServiceNowResponse = {
            message: totalContent,
            type: selectedType,
            timestamp: new Date().toISOString(),
            sessionkey: sessionKey,
            status: 'done'
          };
          
          setResponse(finalResponse);
          setStreamingContent('');
        },
        
        onError: (errorMessage: string) => {
          setIsStreaming(false);
          setIsLoading(false);
          setStreamingClient(null);
          setHasScrolledToResults(false);
          
          // Cleanup cancellation manager
          streamingCancellation.cleanupSession(sessionKey);
          
          setError(errorMessage);
          setStreamingContent('');
        },
        
        onStatusChange: (status: StreamingStatus) => {
          setStreamingStatus(status);
          if (status === StreamingStatus.STREAMING) {
            setIsLoading(false);
          }
        }
      });
      
      setStreamingClient(client);
      
      // Register with cancellation manager
      streamingCancellation.registerSession(sessionKey, client);
      
    } catch (error) {
      console.error('Submit question streaming error:', error);
      setIsStreaming(false);
      setIsLoading(false);
      setStreamingClient(null);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setStreamingContent('');
    }
  };

  const handleStop = async () => {
    // Reset UI state immediately
    setIsLoading(false);
    setIsStreaming(false);
    setAbortController(null);
    setError(null);
    setStreamingContent('');
    
    try {
      // Use enhanced cancellation manager
      if (currentSessionKey) {
        const cancelled = streamingCancellation.cancelSession(currentSessionKey);
        if (cancelled) {
          setStreamingClient(null);
        }
      }
      
      // Fallback: Cancel streaming client directly if still active
      if (streamingClient) {
        streamingClient.cancel();
        setStreamingClient(null);
      }
      
      // Abort the client-side request
      if (abortController) {
        abortController.abort();
      }
      
      // Cancel the server-side polling (fallback compatibility)
      if (currentSessionKey) {
        await cancelRequest(currentSessionKey);
      }
    } catch (error) {
      console.error('Error stopping request:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!question.trim() || isLoading) return;
      handleSubmit();
    }
  };

  const handleHistorySelect = (conversation: ConversationHistoryItem) => {
    setQuestion(conversation.question || conversation.prompt);
    
    // Load the previous response if it exists
    if (conversation.response) {
      const historyResponse: ServiceNowResponse = {
        message: conversation.response,
        type: conversation.type || selectedType,
        sessionkey: conversation.sessionkey || '',
        timestamp: conversation.created_at.toISOString(),
        status: conversation.state || 'done'
      };
      setResponse(historyResponse);
    } else {
      setResponse(null);
    }
    
    // Set the type from the conversation if available
    if (conversation.type) {
      setSelectedType(conversation.type as RequestType);
    }
    
    // Clear any existing error and loading states
    setError(null);
    setIsLoading(false);
    setAbortController(null);
    setIsLoadedFromHistory(true);
    setSelectedFile(null); // Clear any selected file when loading from history
    
    setIsHistoryOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleWelcomeClose = async () => {
    setIsWelcomeSectionVisible(false);
    try {
      await updateSetting('welcome_section_visible', false);
    } catch (err) {
      console.error('Failed to save welcome section setting:', err);
    }
  };


  const handleClearHistory = () => {
    setIsLoadedFromHistory(false);
    setSelectedFile(null); // Also clear any selected file
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-gray-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 relative">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      {/* Subtle background pattern */}
      <div className="absolute inset-0">
        {/* Light theme pattern */}
        <div className="absolute inset-0 opacity-45 dark:hidden" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #94a3b8 1px, transparent 1px),
                           radial-gradient(circle at 75% 75%, #64748b 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
        
        {/* Dark theme pattern */}
        <div className="absolute inset-0 opacity-15 hidden dark:block" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #e0e7ff 0.8px, transparent 0.8px),
                           radial-gradient(circle at 75% 75%, #f0f9ff 0.8px, transparent 0.8px)`,
          backgroundSize: '50px 50px',
          backgroundPosition: '0 0, 25px 25px'
        }}></div>
      </div>
      {/* Header Bar */}
      <header className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50 relative">
        <div className="container mx-auto px-2 sm:px-4 max-w-4xl">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                ServiceN<span className="bg-gradient-to-r from-green-600 to-green-500 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">o</span>w Helper
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="View conversation history"
              >
                <History className="w-5 h-5" />
              </button>
              <BurgerMenu />
            </div>
          </div>
        </div>
      </header>
      
      <div id="main-content" className="container mx-auto px-2 py-4 sm:px-4 sm:py-8 max-w-4xl relative z-10">
        {/* Welcome Section */}
        <WelcomeSection
          isVisible={isWelcomeSectionVisible}
          onClose={handleWelcomeClose}
        />

        {/* Search Form */}
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-4 sm:p-8 md:p-10 mb-4 sm:mb-8 relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in-0 duration-500">
          {/* Enhanced Processing Overlay */}
          <ProcessingOverlay 
            isVisible={isLoading} 
            isStreaming={isStreaming}
            streamingStatus={streamingStatus} 
          />
          
          <div className={`space-y-6 transition-all duration-500 ease-in-out ${
            isLoading && !isStreaming ? 'filter blur-[2px] pointer-events-none opacity-50' : 'filter blur-0 opacity-100'
          }`}>
            {/* Question Input */}
            <QuestionInput
              ref={textareaRef}
              value={question}
              onChange={setQuestion}
              onKeyDown={handleKeyDown}
              placeholder={currentPlaceholder}
              disabled={isLoading}
              isLoadedFromHistory={isLoadedFromHistory}
              onClearHistory={handleClearHistory}
            />

            {/* Type Selection and Expert Mode */}
            <div className="space-y-4 sm:space-y-6">
              {/* Type Selection */}
              <TypeSelector
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                disabled={isLoading}
              />

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Options</span>
                </div>
              </div>

              {/* Toggle Controls */}
              <ToggleControls
                continueMode={continueMode}
                onContinueModeChange={setContinueMode}
                searchMode={searchMode}
                onSearchModeChange={setSearchMode}
                disabled={isLoading}
              />

              {/* File Upload - Only show if current model is multimodal */}
              {isCurrentModelMultimodal() && (
                <>
                  {/* Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Attachment</span>
                    </div>
                  </div>

                  <FileUpload
                    onFileSelect={setSelectedFile}
                    capabilities={getCurrentModel()?.capabilities || []}
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
          </div>

          {/* Submit Button - Outside animated area */}
          <form onSubmit={handleSubmit}>
            <div className="mt-4 sm:mt-6">
              <SubmitButton
                isLoading={isLoading || isStreaming}
                hasQuestion={!!question.trim()}
                onSubmit={() => handleSubmit()}
                onStop={handleStop}
              />
            </div>
          </form>
        </div>

        {/* Results */}
        <div ref={resultsRef}>
          <ResultsSection
            response={response}
            error={error}
            isLoadedFromHistory={isLoadedFromHistory}
            selectedType={selectedType}
            question={question}
            streamingContent={streamingContent}
            isStreaming={isStreaming}
            streamingStatus={streamingStatus}
          />
        </div>

        {/* Footer */}
        <Footer />
      </div>

      {/* History Panel */}
      {isHistoryOpen && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        }>
          <HistoryPanel
            isOpen={isHistoryOpen}
            onClose={() => setIsHistoryOpen(false)}
            onSelectConversation={handleHistorySelect}
          />
        </Suspense>
      )}
    </div>
  );
}