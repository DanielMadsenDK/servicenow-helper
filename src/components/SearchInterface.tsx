'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { History } from 'lucide-react';
import { ServiceNowRequest, ServiceNowResponse, ConversationHistoryItem } from '@/types';
import { submitQuestion, cancelRequest } from '@/lib/api';
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
import { usePlaceholderRotation } from '@/hooks/usePlaceholderRotation';
import { useSessionManager } from '@/hooks/useSessionManager';
import { RequestType } from '@/lib/constants';

// Lazy load heavy components
const HistoryPanel = lazy(() => import('./HistoryPanel'));

export default function SearchInterface() {
  const { settings, updateSetting } = useSettings();
  const [question, setQuestion] = useState('');
  const [selectedType, setSelectedType] = useState<RequestType>(settings.default_request_type);
  const [searchMode, setSearchMode] = useState(settings.default_search_mode);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ServiceNowResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false);
  const [isWelcomeSectionVisible, setIsWelcomeSectionVisible] = useState(settings.welcome_section_visible);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Use custom hooks
  const { continueMode, setContinueMode, getSessionKey, currentSessionKey } = useSessionManager();
  const currentPlaceholder = usePlaceholderRotation({ textareaRef, question });

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
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, delay);
    }
  }, [response, isLoadedFromHistory]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!question.trim()) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setIsLoadedFromHistory(false);

    const sessionKey = getSessionKey();

    const request: ServiceNowRequest = {
      question: question.trim(),
      type: selectedType,
      sessionkey: sessionKey,
      searching: searchMode,
      aiModel: settings.default_ai_model,
    };

    try {
      const result = await submitQuestion(request, controller.signal);

      // Check if request was aborted before processing result
      if (controller.signal.aborted) {
        return;
      }

      if (result.success && result.data) {
        setResponse(result.data);
      } else {
        // Don't show cancellation as an error to the user
        if (result.error !== 'Request was cancelled') {
          setError(result.error || 'An error occurred');
        }
      }
    } catch (error) {
      console.error('Submit question error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't show abort errors to user - this is expected when they click stop
        return;
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      // Only reset state if the request wasn't aborted
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setAbortController(null);
      }
    }
  };

  const handleStop = async () => {
    // Reset UI state immediately
    setIsLoading(false);
    setAbortController(null);
    setError(null);
    
    try {
      // Abort the client-side request
      if (abortController) {
        abortController.abort();
      }
      
      // Cancel the server-side polling
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
          <ProcessingOverlay isVisible={isLoading} />
          
          <div className={`space-y-6 transition-all duration-500 ease-in-out ${
            isLoading ? 'filter blur-[2px] pointer-events-none opacity-50' : 'filter blur-0 opacity-100'
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
            </div>
          </div>

          {/* Submit Button - Outside animated area */}
          <form onSubmit={handleSubmit}>
            <div className="mt-4 sm:mt-6">
              <SubmitButton
                isLoading={isLoading}
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