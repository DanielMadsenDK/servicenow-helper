'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check, Hammer, Code, Eye } from 'lucide-react';

import { useSettings } from '@/contexts/SettingsContext';

interface AgentToolBlockProps {
  children: React.ReactNode;
  rawMarkdown?: string;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: AgentToolBlockProps, nextProps: AgentToolBlockProps): boolean => {
  return prevProps.rawMarkdown === nextProps.rawMarkdown && prevProps.children === nextProps.children;
};

const AgentToolBlock = React.memo(({ children, rawMarkdown = '' }: AgentToolBlockProps) => {
  const [copied, setCopied] = useState(false);
  const { settings, updateSetting } = useSettings();
  const [displayMode, setDisplayMode] = useState<'raw' | 'styled'>(
    settings.agent_tool_block_display_mode || 'styled'
  );

  // Sync local state with settings changes
  useEffect(() => {
    setDisplayMode(settings.agent_tool_block_display_mode || 'styled');
  }, [settings.agent_tool_block_display_mode]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy agent tool:', err);
    }
  };

  const handleToggleDisplay = async () => {
    const newMode = displayMode === 'raw' ? 'styled' : 'raw';
    // Update local state immediately for instant UI feedback
    setDisplayMode(newMode);

    try {
      await updateSetting('agent_tool_block_display_mode', newMode);
    } catch (err) {
      console.error('Failed to update display mode:', err);
      // Revert on error
      setDisplayMode(displayMode);
    }
  };

  return (
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-orange-500/10 dark:shadow-orange-500/20 border border-orange-200/50 dark:border-orange-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/20">
        {/* Header with Hammer Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 border-b border-orange-200/50 dark:border-orange-700/50">
          <div className="flex items-center gap-2">
            <Hammer className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
              Agent Tool
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
              title="Copy agent tool"
              aria-label="Copy agent tool to clipboard"
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

AgentToolBlock.displayName = 'AgentToolBlock';

export default AgentToolBlock;
