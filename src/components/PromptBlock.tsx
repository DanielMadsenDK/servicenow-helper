'use client';

import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Code, Eye } from 'lucide-react';

interface PromptBlockProps {
  children: React.ReactNode;
  rawMarkdown?: string;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: PromptBlockProps, nextProps: PromptBlockProps): boolean => {
  return prevProps.rawMarkdown === nextProps.rawMarkdown && prevProps.children === nextProps.children;
};

const PromptBlock = React.memo(({ children, rawMarkdown = '' }: PromptBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'raw' | 'styled'>('styled');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleToggleDisplay = () => {
    setDisplayMode(displayMode === 'raw' ? 'styled' : 'raw');
  };

  return (
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/20 border border-indigo-200/50 dark:border-indigo-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/20">
        {/* Header with MessageSquare Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/30 dark:to-violet-900/30 border-b border-indigo-200/50 dark:border-indigo-700/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              Prompt
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleDisplay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              title={displayMode === 'raw' ? 'Show styled markdown' : 'Show raw text'}
              aria-label={displayMode === 'raw' ? 'Switch to styled markdown view' : 'Switch to raw text view'}
            >
              {displayMode === 'raw' ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Styled
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5" />
                  Raw
                </>
              )}
            </button>

            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              title="Copy prompt"
              aria-label="Copy prompt to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
          {displayMode === 'raw' ? (
            <pre
              className="text-sm sm:text-base leading-relaxed overflow-x-auto whitespace-pre-wrap text-gray-800 dark:text-gray-200"
              style={{
                fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {rawMarkdown}
            </pre>
          ) : (
            <div className="text-sm sm:text-base leading-relaxed overflow-x-auto text-gray-800 dark:text-gray-200">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, arePropsEqual);

PromptBlock.displayName = 'PromptBlock';

export default PromptBlock;
