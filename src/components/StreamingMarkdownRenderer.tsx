'use client';

import React, { lazy, Suspense, useMemo } from 'react';
import { markdownComponents } from '@/lib/markdown-components';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { isMobileDevice } from '@/lib/streaming-buffer';

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'));

interface StreamingMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  showStreamingCursor?: boolean;
  className?: string;
  enableProgressiveRendering?: boolean;
}

export default function StreamingMarkdownRenderer({ 
  content, 
  isStreaming = false, 
  showStreamingCursor = false,
  className = '',
  enableProgressiveRendering = true
}: StreamingMarkdownRendererProps) {
  
  const isMobile = useMemo(() => isMobileDevice(), []);
  
  // For mobile devices, use progressive rendering threshold
  const progressiveRenderingThreshold = isMobile ? 500 : 200;
  const shouldUseProgressiveRendering = enableProgressiveRendering && 
    content.length > progressiveRenderingThreshold;

  // Enhanced approach: Progressive rendering based on content length and device capabilities
  if (isStreaming) {
    // For very long content on mobile or when progressive rendering is enabled,
    // use ReactMarkdown even during streaming to provide better UX
    if (shouldUseProgressiveRendering && content.length > progressiveRenderingThreshold) {
      return (
        <div className={className} data-testid="markdown-content">
          <Suspense fallback={
            <div className="streaming-raw-content">
              <div className={`whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base ${
                isMobile ? '' : 'will-change-contents'
              }`}>
                {content}
                {showStreamingCursor && (
                  <span className="inline-block w-2 h-5 bg-blue-500 streaming-cursor ml-1"></span>
                )}
              </div>
            </div>
          }>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]} // Always enable GFM for consistent rendering across devices
              rehypePlugins={isMobile ? [] : [rehypeHighlight]} // Only disable syntax highlighting on mobile
              components={markdownComponents}
            >
              {content || ''}
            </ReactMarkdown>
            {showStreamingCursor && (
              <span className="inline-block w-2 h-5 bg-blue-500 streaming-cursor ml-1"></span>
            )}
          </Suspense>
        </div>
      );
    }
    
    // During streaming: Show optimized raw content with minimal DOM operations
    // will-change-contents is conditionally applied based on device capabilities
    return (
      <div className={className}>
        <div className="streaming-raw-content" data-testid="markdown-content">
          <div className={`whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base ${
            isMobile ? '' : 'will-change-contents'
          }`}>
            {content}
            {showStreamingCursor && (
              <span className="inline-block w-2 h-5 bg-blue-500 streaming-cursor ml-1"></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // When streaming is complete: Full ReactMarkdown rendering (identical to history)
  return (
    <div className={className} data-testid="markdown-content">
      <Suspense fallback={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading content...</span>
        </div>
      }>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]} // Always enable GFM for consistent rendering across devices
          rehypePlugins={isMobile ? [] : [rehypeHighlight]} // Only disable syntax highlighting on mobile for better performance
          components={markdownComponents}
        >
          {content || ''}
        </ReactMarkdown>
      </Suspense>
    </div>
  );
}