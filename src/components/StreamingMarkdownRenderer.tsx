'use client';

import React, { lazy, Suspense } from 'react';
import { markdownComponents } from '@/lib/markdown-components';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

// Lazy load ReactMarkdown
const ReactMarkdown = lazy(() => import('react-markdown'));

interface StreamingMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  showStreamingCursor?: boolean;
  className?: string;
}

export default function StreamingMarkdownRenderer({ 
  content, 
  isStreaming = false, 
  showStreamingCursor = false,
  className = ''
}: StreamingMarkdownRendererProps) {

  // Optimized approach: Lightweight raw content during streaming, full ReactMarkdown when complete
  if (isStreaming) {
    // During streaming: Show optimized raw content with minimal DOM operations
    // will-change-contents is only applied here when content is actively being updated
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
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {content || ''}
        </ReactMarkdown>
      </Suspense>
    </div>
  );
}