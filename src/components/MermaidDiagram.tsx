'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '@/contexts/ThemeContext';

interface MermaidDiagramProps {
  code: string;
  isStreaming?: boolean;
}

/**
 * Remove custom fill styles from Mermaid diagram in dark mode
 * This ensures the theme's colors are used, which have proper contrast
 */
function removeCustomFillsInDarkMode(svgElement: SVGSVGElement): void {
  // Find all shape elements with custom fill colors
  const shapes = svgElement.querySelectorAll('rect, circle, ellipse, polygon, path');

  shapes.forEach((shape) => {
    const svgShape = shape as SVGElement;

    // Check if element has a custom fill (from style attribute)
    const fill = svgShape.getAttribute('fill');
    const styleAttr = svgShape.getAttribute('style');

    // Remove fill attribute if it exists
    if (fill && fill !== 'none') {
      svgShape.removeAttribute('fill');
    }

    // Remove fill from style attribute if it exists
    if (styleAttr && styleAttr.includes('fill')) {
      const newStyle = styleAttr
        .split(';')
        .filter(rule => !rule.trim().startsWith('fill'))
        .join(';');

      if (newStyle) {
        svgShape.setAttribute('style', newStyle);
      } else {
        svgShape.removeAttribute('style');
      }
    }
  });
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, isStreaming = false }) => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWaitingForComplete, setIsWaitingForComplete] = useState(false);
  const renderCountRef = useRef(0);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      // CRITICAL: During streaming, NEVER attempt to render
      // Only render when streaming is complete (isStreaming = false)
      // This prevents multiple render attempts and performance issues
      if (isStreaming) {
        setIsWaitingForComplete(true);
        setIsLoading(true);
        setError(null);
        return; // Exit early - don't even try to validate or render
      }

      // Streaming is complete - now we can render
      setIsWaitingForComplete(false);
      setIsLoading(true);
      setError(null);

      try {
        // Initialize Mermaid with current theme
        // Following Mermaid best practices: use 'base' theme with darkMode flag for custom dark styling
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === 'dark' ? 'base' : 'default',
          securityLevel: 'loose',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: 16,
          // CRITICAL: Suppress error rendering - never show error SVG in DOM
          suppressErrorRendering: true,
          flowchart: {
            htmlLabels: false,
            curve: 'basis',
            // Enable automatic text wrapping for long labels
            useMaxWidth: true,
            // Increase node width to prevent text cutoff
            nodeSpacing: 50,
            rankSpacing: 50,
            // Set wrapping width (this works with backtick-quoted strings)
            wrappingWidth: 300,
          },
          themeVariables: theme === 'dark' ? {
            // Following Mermaid documentation for dark mode customization
            darkMode: true,
            background: '#1f2937',
            mainBkg: '#1f2937',
            textColor: '#ffffff',
            primaryTextColor: '#ffffff',
            secondaryTextColor: '#ffffff',
            lineColor: '#9ca3af',
          } : undefined,
        });

        // Validate syntax before rendering to avoid error SVG
        // At this point, streaming is complete (checked above)
        // So any parse error is a real syntax error
        try {
          await mermaid.parse(code);
        } catch (parseError) {
          // Parse failed - throw error to be caught by outer try/catch
          throw new Error(
            parseError instanceof Error
              ? `Syntax error: ${parseError.message}`
              : 'Invalid Mermaid syntax'
          );
        }

        // Generate unique ID for this render
        const id = `mermaid-${Date.now()}-${renderCountRef.current++}`;

        // Render the diagram
        // suppressErrorRendering in config prevents error SVG from appearing
        const { svg } = await mermaid.render(id, code);

        // Insert SVG into container
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // CRITICAL FIX: Remove custom fills in dark mode to ensure proper contrast
          // The theme's default colors have proper text contrast built-in
          if (theme === 'dark') {
            const svgElement = containerRef.current.querySelector('svg');
            if (svgElement) {
              removeCustomFillsInDarkMode(svgElement);
            }
          }

          setIsLoading(false);
        }
      } catch (err) {
        console.error('Mermaid rendering error:', err);

        // Clean up any error SVG that might have been inserted despite our config
        if (containerRef.current) {
          const errorSvgs = containerRef.current.querySelectorAll('svg[id*="mermaid-"]');
          errorSvgs.forEach(svg => {
            if (svg.querySelector('text')?.textContent?.includes('Syntax error')) {
              svg.remove();
            }
          });
        }

        // Only show error if NOT streaming
        // During streaming, we stay in loading state
        if (!isStreaming) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to render Mermaid diagram'
          );
        }
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [code, theme, isStreaming]);

  // Only show error if NOT streaming - during streaming we show loading indicator
  if (error && !isStreaming) {
    return (
      <div className="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-800 dark:text-red-300 font-medium text-sm">
            Mermaid Diagram Error
          </span>
        </div>
        <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        <details className="mt-2">
          <summary className="text-red-600 dark:text-red-400 text-xs cursor-pointer hover:underline">
            View diagram code
          </summary>
          <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-x-auto">
            <code>{code}</code>
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="my-4 sm:my-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 overflow-x-auto">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              {/* Animated diagram icon */}
              <svg
                className="w-16 h-16 text-blue-500 dark:text-blue-400 animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
              {/* Spinning loader ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                {isWaitingForComplete && isStreaming
                  ? 'Generating diagram...'
                  : 'Rendering diagram...'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {isWaitingForComplete && isStreaming
                  ? 'Waiting for complete code from AI'
                  : 'Processing Mermaid syntax'}
              </p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="mermaid-diagram flex justify-center items-center w-full"
          style={{
            minHeight: isLoading ? '100px' : 'auto',
            display: isLoading ? 'none' : 'flex',
            maxWidth: '100%',
          }}
        />
      </div>
      <style jsx global>{`
        .mermaid-diagram svg {
          max-width: 100% !important;
          height: auto !important;
        }

        /* Ensure text is readable */
        .mermaid-diagram svg text,
        .mermaid-diagram svg tspan {
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        /* Node shape minimum dimensions */
        .mermaid-diagram .node rect,
        .mermaid-diagram .node circle,
        .mermaid-diagram .node ellipse,
        .mermaid-diagram .node polygon,
        .mermaid-diagram .node path {
          min-width: 120px !important;
        }
      `}</style>
    </div>
  );
};

export default MermaidDiagram;
