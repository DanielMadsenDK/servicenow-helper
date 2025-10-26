'use client';

import React, { useState } from 'react';
import { Copy, Check, ArrowUpFromLine, Code, Eye } from 'lucide-react';

interface SkillOutputsBlockProps {
  children: React.ReactNode;
  rawMarkdown?: string;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: SkillOutputsBlockProps, nextProps: SkillOutputsBlockProps): boolean => {
  return prevProps.rawMarkdown === nextProps.rawMarkdown && prevProps.children === nextProps.children;
};

const SkillOutputsBlock = React.memo(({ children, rawMarkdown = '' }: SkillOutputsBlockProps) => {
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'raw' | 'styled'>('styled');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy skill outputs:', err);
    }
  };

  const handleToggleDisplay = () => {
    setDisplayMode(displayMode === 'raw' ? 'styled' : 'raw');
  };

  return (
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20 border border-blue-200/50 dark:border-blue-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20">
        {/* Header with ArrowUpFromLine Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 border-b border-blue-200/50 dark:border-blue-700/50">
          <div className="flex items-center gap-2">
            <ArrowUpFromLine className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
              Skill Outputs
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
              title="Copy skill outputs"
              aria-label="Copy skill outputs to clipboard"
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

SkillOutputsBlock.displayName = 'SkillOutputsBlock';

export default SkillOutputsBlock;
