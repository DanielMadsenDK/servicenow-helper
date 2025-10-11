'use client';

import React from 'react';
import { X, Bot } from 'lucide-react';

interface WelcomeSectionProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function WelcomeSection({ isVisible, onClose }: WelcomeSectionProps) {
  if (!isVisible) return null;

  return (
    <div className="text-center mb-4 sm:mb-8 relative animate-in slide-in-from-top-4 fade-in-0 duration-700 delay-200">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-lg shadow-blue-500/5 dark:shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 p-4 sm:p-6 md:p-8 mb-4 sm:mb-8 relative transition-all hover:shadow-xl hover:shadow-blue-500/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
          title="Hide welcome section"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Welcome to ServiceNow Helper!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-4">
              I&apos;m here to help you with ServiceNow implementations, troubleshooting, and best practices. 
              Ask me anything about development, configuration, or problem-solving.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}