'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import { Workflow, Copy, Check } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  // Don't show loading state initially - only show it when we actually start rendering (after streaming completes)
  const [isLoading, setIsLoading] = useState(false);
  const renderCountRef = useRef(0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy diagram code:', err);
    }
  };


  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current || !code) return;

      // CRITICAL: Only wait while streaming is active
      // Once streaming completes (isStreaming = false), proceed to render with complete code
      // This ensures the diagram only renders once with all content, preventing flickering
      if (isStreaming) {
        // Backend still streaming - don't render yet
        return; // Exit early - wait for complete response
      }

      // Streaming is complete - now we can render
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

  // Show streaming overlay while backend is still streaming
  // Once streaming completes (isStreaming = false), diagram renders with complete code
  // This provides visual feedback that we're waiting for the diagram definition
  if (isStreaming) {
    return (
      <div className="relative my-4">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20 border border-amber-200/50 dark:border-amber-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/20">
          {/* Header with Workflow Icon */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-b border-amber-200/50 dark:border-amber-700/50">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Diagram
              </span>
            </div>
          </div>

          {/* Streaming Overlay Content */}
          <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                {/* Animated diagram icon with pulse */}
                <Workflow className="w-16 h-16 text-amber-500 dark:text-amber-400 animate-pulse" />
                {/* Spinning loader ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  Waiting for diagram definition...
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Receiving diagram code from AI
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="relative my-4">
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-amber-500/10 dark:shadow-amber-500/20 border border-amber-200/50 dark:border-amber-700/50 overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/20">
        {/* Header with Workflow Icon and Action Buttons */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-b border-amber-200/50 dark:border-amber-700/50">
          <div className="flex items-center gap-2">
            <Workflow className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Diagram
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-gray-800/95 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-full shadow-sm border border-gray-200/60 dark:border-gray-600/60 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
              title="Copy diagram code to clipboard"
              aria-label="Copy diagram code to clipboard"
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
        <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                {/* Animated diagram icon */}
                <Workflow className="w-16 h-16 text-amber-500 dark:text-amber-400 animate-pulse" />
                {/* Spinning loader ring */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                  Rendering diagram...
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Processing Mermaid syntax
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
