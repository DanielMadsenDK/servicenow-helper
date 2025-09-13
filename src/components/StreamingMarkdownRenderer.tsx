'use client';

import React, { lazy, Suspense, useMemo, memo } from 'react';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

import { markdownComponents } from '@/lib/markdown-components';
import { isMobileDevice } from '@/lib/streaming-buffer';

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'));

// Note: Progress estimation was removed from mobile view as it was unreliable for streaming content
// const PROGRESS_ESTIMATION_FACTOR = 1000;

interface StreamingMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  showStreamingCursor?: boolean;
  className?: string;
  enableProgressiveRendering?: boolean;
}

// Custom comparison function for React.memo
const arePropsEqual = (prevProps: StreamingMarkdownRendererProps, nextProps: StreamingMarkdownRendererProps): boolean => {
  // Deep comparison for content changes
  if (prevProps.content !== nextProps.content) return false;
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.showStreamingCursor !== nextProps.showStreamingCursor) return false;
  if (prevProps.className !== nextProps.className) return false;
  if (prevProps.enableProgressiveRendering !== nextProps.enableProgressiveRendering) return false;
  return true;
};

const StreamingMarkdownRenderer = memo(function StreamingMarkdownRenderer({
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

  // Unified streaming approach for all devices
  if (isStreaming) {
    // For long content when progressive rendering is enabled,
    // use ReactMarkdown even during streaming to provide better UX
    if (shouldUseProgressiveRendering && content.length > progressiveRenderingThreshold) {
      return (
        <div className={className} data-testid="markdown-content">
          <Suspense fallback={
            <div className="streaming-raw-content">
              <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base will-change-contents">
                {content}
                {showStreamingCursor && (
                  <span className="inline-block w-2 h-5 bg-blue-500 streaming-cursor ml-1"></span>
                )}
              </div>
            </div>
          }>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
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
    
    // During streaming: Show optimized raw content with minimal DOM operations for all devices
    return (
      <div className={className}>
        <div className="streaming-raw-content" data-testid="markdown-content">
          <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base will-change-contents">
            {content}
            {showStreamingCursor && (
              <span className="inline-block w-2 h-5 bg-blue-500 streaming-cursor ml-1"></span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // When streaming is complete: Use ReactMarkdown rendering with performance optimizations
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
          rehypePlugins={[rehypeHighlight]} // Enable syntax highlighting for all devices when streaming is complete
          components={markdownComponents}
        >
          {content || ''}
        </ReactMarkdown>
      </Suspense>
    </div>
  );
}, arePropsEqual);

StreamingMarkdownRenderer.displayName = 'StreamingMarkdownRenderer';

export default StreamingMarkdownRenderer;
