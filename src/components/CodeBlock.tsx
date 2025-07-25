'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Maximize2, X } from 'lucide-react';

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
}

const CodeBlock = React.memo(function CodeBlock({ children, className, ...props }: CodeBlockProps & React.HTMLAttributes<HTMLElement>) {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const handleCopy = async () => {
    const code = extractTextContent(children);
    
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen) {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, handleKeyDown]);

  const isCodeBlock = className?.includes('language-');
  
  // Extract text content from React elements recursively
  const extractTextContent = (element: React.ReactNode): string => {
    if (typeof element === 'string') {
      return element;
    }
    if (typeof element === 'number') {
      return element.toString();
    }
    if (React.isValidElement(element)) {
      const props = element.props as Record<string, unknown>;
      if (props && props.children) {
        return extractTextContent(props.children as React.ReactNode);
      }
    }
    if (Array.isArray(element)) {
      return element.map(extractTextContent).join('');
    }
    return '';
  };

  // Get code snippet for mobile preview - preserve React elements for syntax highlighting
  const getCodeSnippet = () => {
    const code = extractTextContent(children);
    const lines = code.split('\n');
    const maxLines = 10;
    const hasMore = lines.length > maxLines;
    
    // For mobile preview, we need to truncate while preserving React structure
    // We'll render the full children but limit the height with CSS
    return { 
      truncatedChildren: children,
      hasMore, 
      totalLines: lines.length 
    };
  };

  // Fullscreen Modal Component
  const FullscreenModal = () => {
    if (!isFullscreen) return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] bg-black"
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-gray-800 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">Code Viewer</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
            <button
              onClick={handleFullscreen}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div 
          className="absolute inset-0 pt-12 overflow-auto bg-black"
          style={{ 
            position: 'absolute',
            top: '48px',
            left: 0,
            right: 0,
            bottom: 0
          }}
        >
          <div className="p-6">
            <pre 
              className="bg-gray-900/80 rounded-lg p-6 text-base leading-relaxed whitespace-pre-wrap border border-gray-700/40"
              style={{ 
                fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                margin: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.9)'
              }}
            >
              <code 
                className={`${className} block`}
                style={{ 
                  fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                  backgroundColor: 'transparent',
                  color: '#ffffff'
                }}
                {...props}
              >
                {children}
              </code>
              <style jsx global>{`
                .hljs-string {
                  color: #ff9500 !important;
                }
                .hljs-keyword {
                  color: #569cd6 !important;
                }
                .hljs-title.function_ {
                  color: #4ec9b0 !important;
                }
                .hljs-params {
                  color: #c586c0 !important;
                }
                .hljs-property {
                  color: #dcdcaa !important;
                }
                .hljs-literal {
                  color: #87ceeb !important;
                }
                .hljs-number {
                  color: #87ceeb !important;
                }
                .hljs-comment {
                  color: #6a9955 !important;
                }
                .hljs-built_in {
                  color: #4ec9b0 !important;
                }
                .hljs-type {
                  color: #4ec9b0 !important;
                }
                .hljs-attr {
                  color: #9cdcfe !important;
                }
                .hljs-name {
                  color: #569cd6 !important;
                }
                .hljs-tag {
                  color: #569cd6 !important;
                }
              `}</style>
            </pre>
          </div>
        </div>

        {/* Mobile tap to close */}
        <div 
          className="absolute inset-0 sm:hidden"
          style={{ zIndex: -1 }}
          onClick={handleFullscreen}
        />
      </div>,
      document.body
    );
  };

  if (isCodeBlock) {
    const { truncatedChildren, hasMore } = getCodeSnippet();
    
    return (
      <>
        {/* Mobile Code Preview */}
        {isMobile ? (
          <div className="relative group my-3 sm:my-4 w-full">
            <div 
              className="relative cursor-pointer bg-gray-50 dark:bg-gray-100 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
              onClick={handleFullscreen}
            >
              <div className="p-3 sm:p-4">
                
                <div className="relative">
                  <pre 
                    className="text-sm leading-relaxed overflow-hidden whitespace-pre-wrap"
                    style={{ 
                      fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                      maxHeight: '12rem', // Approximately 8 lines for mobile optimization
                      lineHeight: '1.5rem'
                    }}
                  >
                    <code 
                      className={`${className} block`} 
                      {...props}
                    >
                      {truncatedChildren}
                    </code>
                  </pre>
                  
                  {/* Subtle fade at bottom if more content */}
                  {hasMore && (
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-50 dark:from-gray-100 to-transparent pointer-events-none" />
                  )}
                </div>
                
                {hasMore && (
                  <div className="mt-2 sm:mt-3 text-center">
                    <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-medium">
                      <span>Show full code</span>
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Code Block */
          <div className="relative group my-3 sm:my-4 w-full">
            <div 
              className="relative bg-gray-50 dark:bg-gray-800/80 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
            >
              <div className="p-3 sm:p-4">
                {/* Action buttons - positioned at top right */}
                <div className="flex items-center justify-end gap-1 sm:gap-2 mb-2 sm:mb-3">
                  <button
                    onClick={handleFullscreen}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-md shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
                    title="View fullscreen"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Toggle full screen
                  </button>
                  
                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-md shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-200"
                    title="Copy code"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                
                <div className="relative">
                  <pre 
                    className="text-sm sm:text-base leading-relaxed overflow-x-auto whitespace-pre-wrap"
                    style={{ 
                      fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    <code 
                      className={`${className} block`} 
                      {...props}
                    >
                      {children}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Modal */}
        <FullscreenModal />
      </>
    );
  }

  // For inline code
  return (
    <code 
      className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm font-mono leading-normal" 
      style={{ 
        fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
        filter: 'contrast(1.1)'
      }}
      {...props}
    >
      {children}
    </code>
  );
});

export default CodeBlock;