'use client';

import React, { lazy, Suspense, useMemo, memo } from 'react';
import remarkGfm from 'remark-gfm';
import remarkFlexibleContainers from 'remark-flexible-containers';
import rehypeHighlight from 'rehype-highlight';

import { createMarkdownComponents } from '@/lib/markdown-components';
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

// Custom comparison function for React.memo
// Returns true if props are EQUAL (skip re-render), false if DIFFERENT (do re-render)
const arePropsEqual = (prevProps: StreamingMarkdownRendererProps, nextProps: StreamingMarkdownRendererProps): boolean => {
  // Content changes require re-render - return false if changed
  if (prevProps.content !== nextProps.content) return false;
  // Streaming state changes require re-render - return false if changed
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  // Cursor visibility changes require re-render - return false if changed
  if (prevProps.showStreamingCursor !== nextProps.showStreamingCursor) return false;
  // Class changes require re-render - return false if changed
  if (prevProps.className !== nextProps.className) return false;
  // Progressive rendering setting changes require re-render - return false if changed
  if (prevProps.enableProgressiveRendering !== nextProps.enableProgressiveRendering) return false;
  // All props are equal - skip re-render
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

  // Create markdown components with streaming state and full content for raw extraction
  // IMPORTANT: Content is needed for raw markdown extraction in AgentBlock/AgentToolBlock
  // The caching mechanism prevents unnecessary re-extractions when only content changes
  const markdownComponents = useMemo(
    () => createMarkdownComponents(isStreaming, content),
    [isStreaming, content]
  );

  // For mobile devices, use progressive rendering threshold
  const progressiveRenderingThreshold = isMobile ? 500 : 200;
  const shouldUseProgressiveRendering = enableProgressiveRendering &&
    content.length > progressiveRenderingThreshold;

  // Unified streaming approach for all devices
  if (isStreaming) {
    // Use ReactMarkdown when content is long enough (progressive rendering)
    if (shouldUseProgressiveRendering) {
      return (
        <div className={className} data-testid="markdown-content">
          <Suspense fallback={
            <div className="streaming-raw-content">
              <div className="whitespace-break-spaces break-words overflow-wrap-anywhere text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base will-change-contents">
                {content}
                {showStreamingCursor && (
                  <span className="inline-flex space-x-1 ml-1">
                    <span className="streaming-dot streaming-dot-shimmer-1"></span>
                    <span className="streaming-dot streaming-dot-shimmer-2"></span>
                    <span className="streaming-dot streaming-dot-shimmer-3"></span>
                  </span>
                )}
              </div>
            </div>
          }>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkFlexibleContainers]}
              rehypePlugins={[rehypeHighlight]}
              components={markdownComponents}
            >
              {content || ''}
            </ReactMarkdown>
            {showStreamingCursor && (
              <span className="inline-flex space-x-1 ml-1">
                <span className="streaming-dot streaming-dot-shimmer-1"></span>
                <span className="streaming-dot streaming-dot-shimmer-2"></span>
                <span className="streaming-dot streaming-dot-shimmer-3"></span>
              </span>
            )}
          </Suspense>
        </div>
      );
    }

    // During streaming: Show optimized raw content with minimal DOM operations for all devices
    return (
      <div className={className}>
        <div className="streaming-raw-content" data-testid="markdown-content">
          <div className="whitespace-break-spaces break-words overflow-wrap-anywhere text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base will-change-contents">
            {content}
            {showStreamingCursor && (
              <span className="inline-flex space-x-1 ml-1">
                <span className="streaming-dot streaming-dot-shimmer-1"></span>
                <span className="streaming-dot streaming-dot-shimmer-2"></span>
                <span className="streaming-dot streaming-dot-shimmer-3"></span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // When streaming is complete: Use ReactMarkdown rendering for all content sizes
  return (
    <div className={className} data-testid="markdown-content">
      <Suspense fallback={
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading content...</span>
        </div>
      }>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkFlexibleContainers]} // Always enable GFM and containers for consistent rendering
          rehypePlugins={[rehypeHighlight]} // Enable syntax highlighting when streaming is complete
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
