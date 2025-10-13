'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Bot, Code, Eye } from 'lucide-react';

import { useSettings } from '@/contexts/SettingsContext';

interface AgentBlockProps {
  children: React.ReactNode;
  rawMarkdown?: string;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: AgentBlockProps, nextProps: AgentBlockProps): boolean => {
  return prevProps.rawMarkdown === nextProps.rawMarkdown && prevProps.children === nextProps.children;
};

const AgentBlock = React.memo(({ children, rawMarkdown = '' }: AgentBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { settings, updateSetting } = useSettings();
  const [displayMode, setDisplayMode] = useState<'raw' | 'styled'>(
    settings.agent_block_display_mode || 'styled'
  );

  // Sync local state with settings changes
  useEffect(() => {
    setDisplayMode(settings.agent_block_display_mode || 'styled');
  }, [settings.agent_block_display_mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy agent instructions:', err);
    }
  };

  const handleToggleDisplay = async () => {
    const newMode = displayMode === 'raw' ? 'styled' : 'raw';
    // Update local state immediately for instant UI feedback
    setDisplayMode(newMode);

    try {
      await updateSetting('agent_block_display_mode', newMode);
    } catch (err) {
      console.error('Failed to update display mode:', err);
      // Revert on error
      setDisplayMode(displayMode);
    }
  };

  return (
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-purple-500/10 dark:shadow-purple-500/20 border border-purple-200/50 dark:border-purple-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-purple-500/20">
        {/* Header with Bot Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 border-b border-purple-200/50 dark:border-purple-700/50">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
              Agent Instructions
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
              title="Copy agent instructions"
              aria-label="Copy agent instructions to clipboard"
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

AgentBlock.displayName = 'AgentBlock';

export default AgentBlock;
