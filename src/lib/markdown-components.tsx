import React from 'react';

import CodeBlock from '@/components/CodeBlock';
import StepGuide, { parseStepSequence } from '@/components/StepGuide';
import AgentBlock from '@/components/AgentBlock';
import AgentToolBlock from '@/components/AgentToolBlock';
import { extractContainerContent } from './markdown-utils';

// Cache for extracted container content to avoid re-running regex on every render
// Key format: "containerType:lineCount"
const extractionCache = new Map<string, string>();

// Create markdown components with optional isStreaming prop and full content for raw extraction
export const createMarkdownComponents = (isStreaming?: boolean, fullContent?: string) => {
  // Count newlines in content for cache key (only re-extract when newlines change)
  const lineCount = fullContent ? (fullContent.match(/\n/g) || []).length : 0;

  // Track which occurrence index of each container type we're currently rendering
  const containerIndexTracker = new Map<string, number>();

  return {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      {...props}
      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline hover:shadow-sm transition-all duration-200"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h1: ({ children, ...props }: any) => (
    <div className="mb-4 sm:mb-8">
      <h1 {...props} className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b-2 border-gray-200 dark:border-gray-600">
        {children}
      </h1>
      <div className="section-divider"></div>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h2: ({ children, ...props }: any) => (
    <div className="mb-4 sm:mb-6 mt-6 sm:mt-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-3 sm:p-4 border-l-4 border-blue-500 shadow-sm">
        <h2 {...props} className="text-xl sm:text-2xl font-semibold text-blue-800 dark:text-blue-300 m-0">
          {children}
        </h2>
      </div>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h3: ({ children, ...props }: any) => (
    <div className="mb-3 sm:mb-4 mt-4 sm:mt-6">
      <h3 {...props} className="text-lg sm:text-xl font-medium text-green-700 dark:text-green-400 mb-2">
        {children}
      </h3>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  h4: ({ children, ...props }: any) => (
    <h4 {...props} className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3 sm:mt-4 border-l-2 border-gray-300 dark:border-gray-600 pl-2 sm:pl-3">
      {children}
    </h4>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  p: ({ children, ...props }: any) => {
    // Check if this paragraph contains step sequences
    const textContent = typeof children === 'string' ? children : 
      React.Children.toArray(children).map(child => 
        typeof child === 'string' ? child : ''
      ).join('');
    
    const steps = parseStepSequence(textContent);
    
    if (steps && steps.length >= 2) {
      return <StepGuide steps={steps} />;
    }
    
    return (
      <p {...props} className="text-gray-700 dark:text-gray-200 leading-relaxed mb-3 sm:mb-4 text-sm sm:text-base">
        {children}
      </p>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ul: ({ children, ...props }: any) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm mb-3 sm:mb-4">
      <ul {...props} className="space-y-2 sm:space-y-3 list-none ml-0">
        {children}
      </ul>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ol: ({ children, ...props }: any) => (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-sm mb-3 sm:mb-4">
      <ol {...props} className="space-y-2 sm:space-y-3 list-none ml-0">
        {children}
      </ol>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  li: ({ children, ...props }: any) => (
    <li {...props} className="text-gray-700 dark:text-gray-200 leading-relaxed pl-5 sm:pl-6 relative flex items-start text-sm sm:text-base">
      <div className="absolute left-0 top-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
      <div className="flex-1">{children}</div>
    </li>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  blockquote: ({ children, ...props }: any) => (
    <div className="my-4 sm:my-6">
      <blockquote {...props} className="border-l-4 border-blue-400 bg-blue-50 dark:bg-blue-900/30 pl-4 sm:pl-6 py-3 sm:py-4 rounded-r-lg italic text-blue-800 dark:text-blue-300 shadow-sm">
        {children}
      </blockquote>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  table: ({ children, ...props }: any) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-600 my-4 sm:my-6">
      <table {...props} className="w-full border-collapse">
        {children}
      </table>
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  code: ({ className, children, ...props }: any) => {
    return (
      <CodeBlock
        className={className}
        isStreaming={isStreaming}
        {...props}
      >
        {children}
      </CodeBlock>
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  div: ({ className, children, ...props }: any) => {
    // Check for any remark-container (scalable for multiple container types)
    if (className?.includes('remark-container')) {
      // Extract container type from className
      // Format: "remark-container agent" or "remark-container agent-tool"
      const classNames = className.split(' ');
      const containerType = classNames.find((c: string) => c !== 'remark-container');

      if (!containerType) {
        return <div className={className} {...props}>{children}</div>;
      }

      // Get the current index for this container type
      // Each time we render a container of a specific type, we increment its index
      const currentIndex = containerIndexTracker.get(containerType) || 0;
      containerIndexTracker.set(containerType, currentIndex + 1);

      // Extract raw markdown for this container type with caching
      // Cache key format: "containerType:index:lineCount" - only re-extract when newlines change
      let rawMarkdown = '';
      if (fullContent) {
        const cacheKey = `${containerType}:${currentIndex}:${lineCount}`;

        // Check cache first
        if (extractionCache.has(cacheKey)) {
          rawMarkdown = extractionCache.get(cacheKey)!;
        } else {
          // Cache miss - extract and store
          rawMarkdown = extractContainerContent(fullContent, containerType, currentIndex);
          extractionCache.set(cacheKey, rawMarkdown);

          // Cleanup old cache entries to prevent memory leaks
          // Keep only last 10 entries per container type
          const typePrefix = `${containerType}:`;
          const typeKeys = Array.from(extractionCache.keys()).filter(k => k.startsWith(typePrefix));
          if (typeKeys.length > 10) {
            // Remove oldest entries (assuming keys are in chronological order)
            typeKeys.slice(0, typeKeys.length - 10).forEach(k => extractionCache.delete(k));
          }
        }
      }

      // Route to appropriate component based on type
      if (containerType === 'agent') {
        return (
          <AgentBlock rawMarkdown={rawMarkdown} {...props}>
            {children}
          </AgentBlock>
        );
      }

      if (containerType === 'agent-tool') {
        return (
          <AgentToolBlock rawMarkdown={rawMarkdown} {...props}>
            {children}
          </AgentToolBlock>
        );
      }

      // Future container types can be added here:
      // if (containerType === 'agent-description') {
      //   return <AgentDescriptionBlock rawMarkdown={rawMarkdown} {...props}>{children}</AgentDescriptionBlock>;
      // }

      // Default: pass rawMarkdown as data attribute for future use
      return (
        <div className={className} data-raw-markdown={rawMarkdown} {...props}>
          {children}
        </div>
      );
    }

    // Regular div - return as-is
    return <div className={className} {...props}>{children}</div>;
  },
  };
};

// Default markdown components (not streaming)
export const markdownComponents = createMarkdownComponents(false);