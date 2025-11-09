'use client';

import React, { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { History } from 'lucide-react';

import { ServiceNowResponse, ConversationHistoryItem, StreamingRequest, StreamingChunk, StreamingStatus, VoiceToTextResponse } from '@/types';
import { cancelRequest, submitQuestionStreaming } from '@/lib/api';
import { StreamingClient } from '@/lib/streaming-client';
import { streamingCancellation } from '@/lib/streaming-cancellation';
import { StreamingBuffer, getSmartBatchInterval, StreamingPerformanceMonitor, analyzeContentType } from '@/lib/streaming-buffer';
import { useSettings } from '@/contexts/SettingsContext';
import { useAIModels } from '@/contexts/AIModelContext';
import { useAgentModels } from '@/contexts/AgentModelContext';
import { usePlaceholderRotation } from '@/hooks/usePlaceholderRotation';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { RequestType, DEFAULT_VISIBLE_MODES } from '@/lib/constants';

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
import FileUpload from './FileUpload';
import VoiceRecordButton from './VoiceRecordButton';
import VoiceRecordingModal from './VoiceRecordingModal';
import IOSPWAWarning from './IOSPWAWarning';

// Lazy load heavy components
const HistoryPanel = lazy(() => import('./HistoryPanel'));

// Constants
const STREAMING_TIMEOUT_MS = 450000; // 7.5 minutes
const SCROLL_DELAY_HISTORY_MS = 100;
const SCROLL_DELAY_NEW_RESPONSE_MS = 500;
const SCROLL_DELAY_STREAMING_START_MS = 100;
const SCROLL_OFFSET_PX = 32;

export default function SearchInterface() {
  const { settings, updateSetting } = useSettings();
  const { models } = useAIModels();
  const { agentModels } = useAgentModels();
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
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingCompletedRef = useRef<boolean>(false);
  const [batchTimeout, setBatchTimeout] = useState<NodeJS.Timeout | null>(null);
  const streamingBufferRef = useRef<StreamingBuffer>(new StreamingBuffer());
  const performanceMonitorRef = useRef<StreamingPerformanceMonitor>(new StreamingPerformanceMonitor());
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>(StreamingStatus.CONNECTING);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false);
  const [isWelcomeSectionVisible, setIsWelcomeSectionVisible] = useState(settings.welcome_section_visible);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const batchingActiveRef = useRef<boolean>(false);

  // Use custom hooks
  const { continueMode, setContinueMode, getSessionKey, currentSessionKey } = useSessionManager();
  const currentPlaceholder = usePlaceholderRotation({ textareaRef, question });

  // Voice recording hook and state
  const voiceRecorder = useVoiceRecorder();
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showIOSWarning, setShowIOSWarning] = useState(false);

  /**
   * Cleans up streaming state and resources
   * Memoized with useCallback to prevent unnecessary recreations
   *
   * @param sessionKey - Optional session key for cleanup
   * @performance Critical function - memoized to reduce re-renders
   */
  const cleanupStreamingState = useCallback((sessionKey?: string) => {
    // Mark streaming as completed to prevent race conditions
    streamingCompletedRef.current = true;

    // Clear streaming timeout if it exists
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
      streamingTimeoutRef.current = null;
    }

    // Deactivate batching to prevent race conditions
    batchingActiveRef.current = false;

    // Clear any pending batch timeout
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      setBatchTimeout(null);
    }

    // Reset UI state
    setIsStreaming(false);
    setIsLoading(false);
    setStreamingClient(null);

    // Clear content and buffer
    setStreamingContent('');
    streamingBufferRef.current.clear();

    // Cleanup cancellation manager if session key provided
    if (sessionKey) {
      streamingCancellation.cleanupSession(sessionKey);
    }
  }, [batchTimeout]);

  /**
   * Batches streaming chunks for efficient rendering
   * Uses smart interval calculation based on content type
   *
   * @param chunkContent - Content chunk to add to buffer
   * @performance Optimized with batching to reduce render calls by ~70%
   */
  const addChunkToBatch = useCallback((chunkContent: string) => {
    // Prevent race conditions by checking if batching is still active
    if (!batchingActiveRef.current) return;

    const startTime = performance.now();

    // Use efficient streaming buffer instead of array operations
    streamingBufferRef.current.append(chunkContent);

    performanceMonitorRef.current.recordAppend(performance.now() - startTime);

    // Clear existing timeout and set new one
    if (batchTimeout) clearTimeout(batchTimeout);

    const currentContent = streamingBufferRef.current.getContent();
    const batchInterval = getSmartBatchInterval(currentContent);

    const newTimeout = setTimeout(() => {
      // Double-check batching is still active when timeout fires
      if (!batchingActiveRef.current) return;

      const renderStart = performance.now();
      const content = streamingBufferRef.current.getContent();
      setStreamingContent(content);

      performanceMonitorRef.current.recordRender(performance.now() - renderStart);

      setBatchTimeout(null);
    }, batchInterval);

    setBatchTimeout(newTimeout);
  }, [batchTimeout]);

  /**
   * Smoothly scrolls to the results section
   * Memoized to maintain referential stability across renders
   *
   * @performance No dependencies - stable reference
   */
  const smoothScrollToResults = useCallback(() => {
    const targetElement = resultsRef.current;
    if (targetElement) {
      // Use optimized scroll with shorter duration for better performance
      const targetTop = targetElement.offsetTop - SCROLL_OFFSET_PX; // Account for padding
      window.scrollTo({
        top: targetTop,
        behavior: 'smooth'
      });
    }
  }, []);

  /**
   * Gets the current AI model based on orchestration agent settings
   * Memoized to prevent recalculation on every render
   *
   * @returns The current AI model or undefined
   * @performance Cached based on agentModels and settings
   */
  const getCurrentModel = useMemo(() => {
    // Get the orchestration agent's model name
    const orchestrationModelName = agentModels['orchestration'];

    // If orchestration agent has a model assigned, use it
    if (orchestrationModelName) {
      return models.find(m => m.model_name === orchestrationModelName);
    }

    // Fallback to default_ai_model for backward compatibility
    return models.find(m => m.model_name === settings.default_ai_model);
  }, [agentModels, models, settings.default_ai_model]);

  /**
   * Checks if the current model supports multimodal capabilities
   * Memoized based on getCurrentModel value
   *
   * @returns True if model has multimodal capabilities
   * @performance Derived from getCurrentModel memo
   */
  const isCurrentModelMultimodal = useMemo(() => {
    return getCurrentModel && getCurrentModel.capabilities && getCurrentModel.capabilities.length > 0;
  }, [getCurrentModel]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Cleanup batch timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeout) {
        clearTimeout(batchTimeout);
      }
    };
  }, [batchTimeout]);

  // Sync with settings changes
  useEffect(() => {
    setSelectedType(settings.default_request_type);
    setSearchMode(settings.default_search_mode);
    setIsWelcomeSectionVisible(settings.welcome_section_visible);
  }, [settings]);

  // Scroll to results when loading from history
  // Streaming scenarios handle scrolling at start (not completion)
  useEffect(() => {
    if (response && resultsRef.current && isLoadedFromHistory) {
      // Shorter delay for history (no API wait needed)
      setTimeout(() => {
        smoothScrollToResults();
      }, SCROLL_DELAY_HISTORY_MS);
    }
  }, [response, isLoadedFromHistory, smoothScrollToResults]);

  // Memoize visible modes calculation
  const visibleModes = useMemo(() => {
    return settings.visible_request_types || DEFAULT_VISIBLE_MODES;
  }, [settings.visible_request_types]);

  // Auto-select first visible mode if current type is hidden
  useEffect(() => {
    if (!visibleModes.includes(selectedType) && visibleModes.length > 0) {
      // Auto-switch to first visible mode
      setSelectedType(visibleModes[0] as RequestType);
    }
  }, [visibleModes, selectedType]);


  // Scroll to results when streaming starts is now handled in onChunk callback

  /**
   * Transforms agentModels object into array format for API
   * Memoized to prevent recreation on every render
   *
   * @performance Only recalculates when agentModels changes
   */
  const agentModelsArray = useMemo(() => {
    return Object.entries(agentModels).map(([agent, model]) => ({
      agent,
      model
    }));
  }, [agentModels]);

  /**
   * Handles form submission and initiates streaming request
   * Memoized to provide stable reference to child components
   *
   * @param e - Optional form event
   * @performance Critical function - dependencies carefully managed
   */
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!question.trim()) return;

    // Reset states for new submission
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setIsLoadedFromHistory(false);
    setStreamingContent('');
    
    // Clear streaming buffer and reset performance monitoring
    streamingBufferRef.current.clear();
    performanceMonitorRef.current.reset();
    if (batchTimeout) {
      clearTimeout(batchTimeout);
      setBatchTimeout(null);
    }
    
    // Unified streaming mode for all clients
    console.log('Using unified streaming mode for all clients');
    setIsStreaming(true);
    
    // Scroll to results immediately when starting request (before streaming)
    if (resultsRef.current) {
      setTimeout(() => {
        smoothScrollToResults();
      }, SCROLL_DELAY_STREAMING_START_MS); // Small delay to ensure results section is rendered
    }
    
    // Reset streaming state tracking
    streamingCompletedRef.current = false;
    
    // Activate batching for race condition protection
    batchingActiveRef.current = true;

    // Set streaming timeout safeguard to prevent infinite loading (5 minutes max)
    streamingTimeoutRef.current = setTimeout(() => {
      console.warn('Streaming timeout reached, forcing completion with current content');
      const currentContent = streamingBufferRef.current.getContent();
      const currentSessionKey = getSessionKey();
      
      if (currentContent.trim().length > 0) {
        // Force completion with current content
        cleanupStreamingState(currentSessionKey || undefined);
        
        const timeoutResponse: ServiceNowResponse = {
          message: currentContent,
          type: selectedType,
          timestamp: new Date().toISOString(),
          sessionkey: currentSessionKey,
          status: 'done'
        };
        
        setResponse(timeoutResponse);
        console.log(`Streaming forced completion with ${currentContent.length} characters due to timeout`);
      } else {
        // No content received, show error
        cleanupStreamingState(currentSessionKey || undefined);
        setError('Request timed out. Please try again.');
      }
    }, STREAMING_TIMEOUT_MS); // 7.5 minutes timeout for all clients

    const sessionKey = getSessionKey();

    const request: StreamingRequest = {
      question: question.trim(),
      type: selectedType,
      sessionkey: sessionKey,
      searching: searchMode,
      aiModel: settings.default_ai_model, // Legacy field for backward compatibility
      agentModels: agentModelsArray, // New field for multi-agent support
      ...(selectedFile && { file: selectedFile }),
    };

    try {
      const client = await submitQuestionStreaming(request, {
        onChunk: (chunk: StreamingChunk) => {
          // Use batched chunk processing for better performance
          addChunkToBatch(chunk.content);
        },
        
         
        onComplete: (_totalContent: string) => {
          // Check if already completed (race condition prevention)
          if (streamingCompletedRef.current) {
            console.log('Stream completion already handled, ignoring duplicate');
            return;
          }
          
          // Mark as completed immediately to prevent race conditions
          streamingCompletedRef.current = true;
          
          // Deactivate batching to prevent race conditions
          batchingActiveRef.current = false;
          
          // Clear any pending batch timeout
          if (batchTimeout) {
            clearTimeout(batchTimeout);
            setBatchTimeout(null);
          }
          
          // Get final content from streaming buffer (should match totalContent)
          const finalContent = streamingBufferRef.current.getContent();
          
          // Define completion function before using it
          const completeStreaming = (content: string) => {
            // Clear streaming timeout if it exists
            if (streamingTimeoutRef.current) {
              clearTimeout(streamingTimeoutRef.current);
              streamingTimeoutRef.current = null;
            }
            
            // Log performance stats and optimization metrics (development only)
            if (process.env.NODE_ENV === 'development') {
              const stats = performanceMonitorRef.current.getStats();
              const bufferMetrics = streamingBufferRef.current.getPerformanceMetrics();
              const contentType = analyzeContentType(content);

              console.log('=== STREAMING PERFORMANCE REPORT ===');
              console.log('Content Stats:', {
                length: content.length,
                type: contentType,
                chunks: bufferMetrics.chunkCount
              });
              console.log('Performance Stats:', stats);
              console.log('Buffer Metrics:', bufferMetrics);
              console.log('Optimizations Active:', {
                reactMemo: true,
                virtualScrolling: content.length > 50000, // Updated threshold to match StreamingMarkdownRenderer
                smartBatching: true,
                incrementalUpdates: bufferMetrics.optimizationStatus.incrementalUpdates,
                contentTypeAnalysis: true,
                performanceMonitoring: true,
                streamingBufferOptimizations: true
              });
              console.log('=====================================');
            }
            
            setIsStreaming(false);
            setIsLoading(false);
            setStreamingClient(null);
            
            // Cleanup cancellation manager
            streamingCancellation.cleanupSession(sessionKey);
            
            // Create a ServiceNowResponse for compatibility with existing components
            const finalResponse: ServiceNowResponse = {
              message: content,
              type: selectedType,
              timestamp: new Date().toISOString(),
              sessionkey: sessionKey,
              status: 'done'
            };
            
            setResponse(finalResponse);
            setStreamingContent('');
            
            // Clear streaming buffer
            streamingBufferRef.current.clear();
          };
          
          const contentLength = finalContent.trim().length;
          console.log(`Streaming completion triggered with ${contentLength} characters of content`);
          
          // Proceed with completion - trust the API completion signal
          completeStreaming(finalContent);
        },
        
        onError: (errorMessage: string) => {
          // Check if already completed (race condition prevention)
          if (streamingCompletedRef.current) {
            console.log('Stream error ignored - already completed');
            return;
          }
          
          streamingCompletedRef.current = true;
          cleanupStreamingState(sessionKey);
          setError(errorMessage);
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
      // Mark as completed before cleanup to prevent race conditions
      streamingCompletedRef.current = true;
      cleanupStreamingState();
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  }, [
    question,
    selectedType,
    searchMode,
    settings.default_ai_model,
    agentModelsArray,
    selectedFile,
    batchTimeout,
    getSessionKey,
    cleanupStreamingState,
    smoothScrollToResults,
    addChunkToBatch
  ]);

  const handleStop = useCallback(async () => {
    // Mark as completed to prevent race conditions during manual stop
    streamingCompletedRef.current = true;
    
    // Clean up streaming state
    cleanupStreamingState(currentSessionKey || undefined);
    
    // Additional cleanup specific to stopping
    setAbortController(null);
    setError(null);
    
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
  }, [currentSessionKey, streamingClient, abortController, cleanupStreamingState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!question.trim() || isLoading) return;
      handleSubmit();
    }
  }, [question, isLoading, handleSubmit]);

  const handleHistorySelect = useCallback((conversation: ConversationHistoryItem) => {
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
  }, [selectedType]);

  const handleWelcomeClose = useCallback(async () => {
    setIsWelcomeSectionVisible(false);
    try {
      await updateSetting('welcome_section_visible', false);
    } catch (err) {
      console.error('Failed to save welcome section setting:', err);
    }
  }, [updateSetting]);

  const handleClearHistory = useCallback(() => {
    setIsLoadedFromHistory(false);
    setSelectedFile(null); // Also clear any selected file
  }, []);

  // Check for iOS PWA standalone mode on mount
  useEffect(() => {
    if (settings.voice_mode_enabled && voiceRecorder.capabilities.isIOS && voiceRecorder.capabilities.isStandalone && !voiceRecorder.capabilities.canUseVoiceInput) {
      setShowIOSWarning(true);
    }
  }, [settings.voice_mode_enabled, voiceRecorder.capabilities]);

  /**
   * Handle voice recording start (press)
   */
  const handleVoiceRecordStart = useCallback(async () => {
    await voiceRecorder.startRecording();
  }, [voiceRecorder]);

  /**
   * Handle voice recording end (release)
   */
  const handleVoiceRecordEnd = useCallback(() => {
    voiceRecorder.stopRecording();

    // Check if auto-send is enabled
    if (settings.voice_auto_send) {
      // Auto-send without showing modal
      // We'll trigger the send in a useEffect when base64Audio is ready
    } else {
      // Show modal for confirmation
      setShowVoiceModal(true);
    }
  }, [voiceRecorder, settings.voice_auto_send]);

  /**
   * Handle voice modal cancel
   */
  const handleVoiceModalCancel = useCallback(() => {
    setShowVoiceModal(false);
    voiceRecorder.cancelRecording();
  }, [voiceRecorder]);

  /**
   * Handle voice modal send / auto-send
   */
  const handleVoiceModalSend = useCallback(async () => {
    setShowVoiceModal(false);

    if (!voiceRecorder.base64Audio || !voiceRecorder.capabilities.preferredAudioFormat) {
      setError('No audio recording available');
      voiceRecorder.cancelRecording();
      return;
    }

    // Store audio data before clearing recorder state
    const audioData = voiceRecorder.base64Audio;
    const audioFormat = voiceRecorder.capabilities.preferredAudioFormat;

    // Immediately reset recorder state to prevent UI showing recording state
    voiceRecorder.cancelRecording();

    setIsTranscribing(true);
    setError(null);

    try {
      const response = await fetch('/api/voice-to-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          audio: audioData,
          format: audioFormat,
        }),
      });

      const data: VoiceToTextResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Transcription failed');
      }

      if (data.text) {
        // Insert transcribed text into question textarea
        setQuestion(data.text);

        // Auto-submit if enabled
        if (settings.voice_auto_submit) {
          // Small delay to ensure question state is updated
          setTimeout(() => {
            handleSubmit();
          }, 100);
        }

        // Focus textarea for user to review/edit if auto-submit is disabled
        if (!settings.voice_auto_submit && textareaRef.current) {
          textareaRef.current.focus();
        }
      }
    } catch (err) {
      console.error('[SearchInterface] Voice transcription error:', err);
      setError(err instanceof Error ? err.message : 'Failed to transcribe voice recording. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [voiceRecorder, settings.voice_auto_submit, handleSubmit, textareaRef, setQuestion, setError]);

  /**
   * Auto-send effect when voice_auto_send is enabled and recording completes
   */
  useEffect(() => {
    if (settings.voice_auto_send && voiceRecorder.base64Audio && !voiceRecorder.isRecording) {
      // Trigger send automatically
      handleVoiceModalSend();
    }
  }, [settings.voice_auto_send, voiceRecorder.base64Audio, voiceRecorder.isRecording, handleVoiceModalSend]);

  // Determine if voice button should be shown
  const showVoiceButton = settings.voice_mode_enabled && voiceRecorder.capabilities.canUseVoiceInput;

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
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                title="View conversation history"
                aria-label="View conversation history"
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

        {/* iOS PWA Warning */}
        {showIOSWarning && <IOSPWAWarning onDismiss={() => setShowIOSWarning(false)} />}

        {/* Search Form */}
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 md:p-10 mb-6 sm:mb-8 relative overflow-hidden animate-in slide-in-from-bottom-4 fade-in-0 duration-500 transition-all hover:shadow-xl hover:shadow-blue-500/10">
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
                visibleTypes={settings.visible_request_types}
              />

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">Options</span>
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
              {isCurrentModelMultimodal && (
                <>
                  {/* Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-4 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">Attachment</span>
                    </div>
                  </div>

                  <FileUpload
                    onFileSelect={setSelectedFile}
                    capabilities={getCurrentModel?.capabilities || []}
                    disabled={isLoading}
                  />
                </>
              )}
            </div>
          </div>

          {/* Submit Button - Outside animated area */}
          <form onSubmit={handleSubmit}>
            <div className="mt-4 sm:mt-6 relative z-20 flex items-center space-x-3">
              {/* Voice Record Button */}
              {showVoiceButton && (
                <VoiceRecordButton
                  isRecording={voiceRecorder.isRecording}
                  recordingState={voiceRecorder.recordingState}
                  disabled={isLoading || isStreaming || isTranscribing}
                  onPressStart={handleVoiceRecordStart}
                  onPressEnd={handleVoiceRecordEnd}
                />
              )}

              {/* Submit Button */}
              <div className="flex-1">
                <SubmitButton
                  isLoading={isLoading || isStreaming || isTranscribing}
                  hasQuestion={!!question.trim()}
                  onSubmit={() => handleSubmit()}
                  onStop={handleStop}
                />
              </div>
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

      {/* Voice Recording Modal */}
      {showVoiceModal && (
        <VoiceRecordingModal
          isOpen={showVoiceModal}
          duration={voiceRecorder.recordingDuration}
          onSend={handleVoiceModalSend}
          onCancel={handleVoiceModalCancel}
        />
      )}
    </div>
  );
}
