'use client';

import React from 'react';
import { Bot } from 'lucide-react';

import { StreamingStatus } from '@/types';

interface ProcessingOverlayProps {
  isVisible: boolean;
  isStreaming?: boolean;
  streamingStatus?: StreamingStatus;
}

export default function ProcessingOverlay({ 
  isVisible, 
  isStreaming = false, 
  streamingStatus = StreamingStatus.CONNECTING 
}: ProcessingOverlayProps) {
  if (!isVisible) return null;

  // Determine the message based on streaming status
  const getStatusMessage = () => {
    if (!isStreaming) return 'Working on your question';
    
    switch (streamingStatus) {
      case StreamingStatus.CONNECTING:
        return 'Connecting to AI service';
      case StreamingStatus.STREAMING:
        return 'AI is responding';
      default:
        return 'Processing your request';
    }
  };

  const getTitle = () => {
    if (!isStreaming) return 'Processing Request';
    
    switch (streamingStatus) {
      case StreamingStatus.CONNECTING:
        return 'Establishing Connection';
      case StreamingStatus.STREAMING:
        return 'Streaming Response';
      default:
        return 'Processing Request';
    }
  };

  return (
    <div className="absolute inset-0 z-10 rounded-3xl animate-in fade-in-0 duration-500">
      {/* Backdrop blur and gradient overlay */}
      <div className="absolute inset-0 backdrop-blur-md bg-gradient-to-br from-white/80 via-blue-50/70 to-indigo-50/70 dark:from-gray-900/80 dark:via-blue-900/70 dark:to-indigo-900/70 rounded-3xl"></div>
      
      {/* Animated processing indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-8 max-w-sm mx-4 animate-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-6">
            {/* Friendly AI Assistant Icon */}
            <div className="relative">
              {/* Main bot icon - matches welcome screen design */}
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg animate-breathing">
                <Bot className="w-8 h-8 text-white" />
              </div>
              
              {/* Subtle activity indicators */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
            </div>
            
            {/* Processing text with typing animation */}
            <div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                {getTitle()}
              </h3>
              <div className="flex items-center justify-center space-x-1 text-gray-600 dark:text-gray-400">
                <span className="text-sm">{getStatusMessage()}</span>
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
            
            {/* Progress wave animation */}
            <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full animate-pulse"></div>
              <div className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 animate-slide-right"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}