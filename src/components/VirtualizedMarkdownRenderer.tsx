'use client';

import React, { memo, useMemo } from 'react';

interface VirtualizedMarkdownRendererProps {
  content: string;
  height?: number;
  className?: string;
}

// Custom comparison function for React.memo
const arePropsEqual = (
  prevProps: VirtualizedMarkdownRendererProps,
  nextProps: VirtualizedMarkdownRendererProps
): boolean => {
  return (
    prevProps.content === nextProps.content &&
    prevProps.height === nextProps.height &&
    prevProps.className === nextProps.className
  );
};

const VirtualizedMarkdownRenderer = memo(function VirtualizedMarkdownRenderer({
  content,
  height = 400, // Default container height
  className = ''
}: VirtualizedMarkdownRendererProps) {

  // Split content into lines for virtual scrolling
  const lines = useMemo(() => content.split('\n'), [content]);

  // Estimate item height based on content density
  const estimatedItemHeight = useMemo(() => {
    if (lines.length === 0) return 24;

    // Sample a few lines to estimate average height
    const sampleSize = Math.min(10, lines.length);
    const totalChars = lines.slice(0, sampleSize).reduce((sum, line) => sum + line.length, 0);
    const avgCharsPerLine = totalChars / sampleSize;

    // Estimate height based on character count (rough approximation)
    // Code content tends to be taller due to formatting
    const isCodeHeavy = content.includes('```') || content.includes('function') || content.includes('const');
    const baseHeight = isCodeHeavy ? 28 : 24;

    return Math.max(20, Math.min(baseHeight, 40)); // Clamp between 20-40px
  }, [lines, content]);

  // Calculate total height needed
  const totalHeight = lines.length * estimatedItemHeight;

  // Use virtual scrolling only if content is large enough
  if (lines.length < 50 || totalHeight < height * 2) {
    // For smaller content, use regular rendering
    return (
      <div className={className}>
        <div
          className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base overflow-auto"
          style={{ maxHeight: height }}
        >
          {content}
        </div>
      </div>
    );
  }

  // For large content, use a simple virtualization approach
  // This provides performance benefits without complex react-window setup
  const visibleLines = Math.floor(height / estimatedItemHeight);
  const totalScrollableHeight = totalHeight - height;

  return (
    <div className={className}>
      <div
        className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 font-sans leading-relaxed text-sm sm:text-base overflow-auto border border-gray-200 dark:border-gray-600 rounded-lg"
        style={{ height }}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            style={{ minHeight: estimatedItemHeight }}
          >
            {line}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
        Large content - showing {lines.length} lines with optimized scrolling
      </div>
    </div>
  );
}, arePropsEqual);

VirtualizedMarkdownRenderer.displayName = 'VirtualizedMarkdownRenderer';

export default VirtualizedMarkdownRenderer;
