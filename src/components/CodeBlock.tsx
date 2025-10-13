'use client';

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Check, Maximize2, X, Code as CodeIcon } from 'lucide-react';

import SendScriptButton from './SendScriptButton';

// Lazy load MermaidDiagram component
const MermaidDiagram = lazy(() => import('./MermaidDiagram'));

interface CodeBlockProps {
  children: React.ReactNode;
  className?: string;
  isStreaming?: boolean;
}

const CodeBlock = React.memo(({ children, className, isStreaming = false, ...props }: CodeBlockProps & React.HTMLAttributes<HTMLElement>) => {
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
  const isMermaid = className?.includes('language-mermaid');
  
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
            <SendScriptButton 
              scriptContent={extractTextContent(children)}
              size="sm"
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            />
            
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

  // Mermaid Diagram Rendering - handled by the MermaidDiagram component itself
  // which now has its own container with header
  if (isMermaid) {
    const code = extractTextContent(children);

    return (
      <Suspense
        fallback={
          <div className="relative my-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20 border border-amber-200/50 dark:border-amber-700/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-b border-amber-200/50 dark:border-amber-700/50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-600 dark:bg-amber-400 rounded animate-pulse"></div>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Diagram
                  </span>
                </div>
              </div>
              <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
                    Loading diagram...
                  </span>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <MermaidDiagram code={code} isStreaming={isStreaming} />
      </Suspense>
    );
  }

  if (isCodeBlock) {
    const { truncatedChildren, hasMore } = getCodeSnippet();

    return (
      <>
        {/* Mobile Code Preview */}
        {isMobile ? (
          <div className="relative my-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/20 border border-emerald-200/50 dark:border-emerald-700/50 overflow-hidden">
              {/* Header with Code Icon */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-200/50 dark:border-emerald-700/50">
                <div className="flex items-center gap-2">
                  <CodeIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Code
                  </span>
                </div>
                <button
                  onClick={handleFullscreen}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                  title="View fullscreen"
                  aria-label="Toggle fullscreen view"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content Area - Clickable preview */}
              <div
                className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700 transition-colors"
                onClick={handleFullscreen}
              >
                <div className="relative">
                  <pre
                    className="text-sm leading-relaxed overflow-hidden whitespace-pre-wrap"
                    style={{
                      fontFamily: "'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', monospace",
                      maxHeight: '12rem',
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
                    <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent pointer-events-none" />
                  )}
                </div>

                {hasMore && (
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      <span>Tap to view full code</span>
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Desktop Code Block */
          <div className="relative my-4">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/20 border border-emerald-200/50 dark:border-emerald-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/20">
              {/* Header with Code Icon and Action Buttons */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-b border-emerald-200/50 dark:border-emerald-700/50">
                <div className="flex items-center gap-2">
                  <CodeIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                    Code
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <SendScriptButton
                    scriptContent={extractTextContent(children)}
                    size="sm"
                  />

                  <button
                    onClick={handleFullscreen}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                    title="View fullscreen"
                    aria-label="Toggle fullscreen view"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Toggle full screen
                  </button>

                  <button
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
                    title="Copy code to clipboard"
                    aria-label="Copy code to clipboard"
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

CodeBlock.displayName = 'CodeBlock';

export default CodeBlock;