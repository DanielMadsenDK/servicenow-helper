/**
 * Mermaid Export Utilities
 * Handles conversion of Mermaid diagrams to images for PDF export
 */

import mermaid from 'mermaid';

export interface MermaidBlock {
  code: string;
  startLine: number;
  endLine: number;
}

/**
 * Detect Mermaid code blocks in markdown content
 */
export function detectMermaidBlocks(content: string): MermaidBlock[] {
  const blocks: MermaidBlock[] = [];
  const lines = content.split('\n');
  let inMermaidBlock = false;
  let currentBlock: string[] = [];
  let startLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```mermaid')) {
      inMermaidBlock = true;
      startLine = i;
      currentBlock = [];
      continue;
    }

    if (inMermaidBlock && line.trim().startsWith('```')) {
      blocks.push({
        code: currentBlock.join('\n'),
        startLine,
        endLine: i,
      });
      inMermaidBlock = false;
      currentBlock = [];
      startLine = -1;
      continue;
    }

    if (inMermaidBlock) {
      currentBlock.push(line);
    }
  }

  return blocks;
}

/**
 * Strip custom fill styles from Mermaid code to ensure proper text contrast
 * This is especially important for PDF export where light fills cause invisible text
 */
function stripCustomFillStyles(mermaidCode: string): string {
  // Remove style statements with fill property
  // Matches patterns like: style A fill:#e1f5fe
  const lines = mermaidCode.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    // Keep the line unless it's a style statement with fill
    return !(trimmed.startsWith('style ') && trimmed.includes('fill:'));
  });
  return filteredLines.join('\n');
}

// Track if Mermaid has been initialized for export
let isExportInitialized = false;

/**
 * Inject theme configuration into Mermaid code using frontmatter
 * This is the recommended approach per Mermaid documentation
 */
function injectThemeConfig(mermaidCode: string, theme: 'default' | 'dark' = 'default'): string {
  // Check if code already has frontmatter
  const hasFrontmatter = mermaidCode.trim().startsWith('---');

  if (hasFrontmatter) {
    // Replace existing theme in frontmatter
    return mermaidCode.replace(
      /theme:\s*['"]?\w+['"]?/,
      `theme: '${theme}'`
    );
  }

  // Add frontmatter with light theme configuration
  const frontmatter = `---
config:
  theme: '${theme}'
  themeVariables:
    primaryColor: '#fff4de'
    primaryTextColor: '#000000'
    primaryBorderColor: '#9370db'
    lineColor: '#333333'
    secondaryColor: '#ffcccc'
    tertiaryColor: '#ccffcc'
    background: '#ffffff'
    mainBkg: '#ffffff'
    secondaryBkg: '#f5f5f5'
    textColor: '#000000'
    nodeTextColor: '#000000'
    labelColor: '#000000'
---
`;

  return frontmatter + mermaidCode;
}

/**
 * Render Mermaid code to SVG string for PDF embedding
 * Returns the raw SVG which can be embedded directly using jsPDF's addSvgAsImage
 *
 * IMPORTANT: Following Mermaid documentation best practices:
 * - Initialize Mermaid once (not per diagram)
 * - Use frontmatter/directives to override theme per diagram
 */
export async function renderMermaidToImage(
  code: string,
  theme: 'default' | 'dark' = 'default'
): Promise<string> {
  try {
    console.log('renderMermaidToImage called with theme:', theme);
    console.log('Original code length:', code.length);

    // Strip custom fills to ensure text visibility
    // Custom fills often cause contrast issues in PDF exports
    const cleanCode = stripCustomFillStyles(code);
    console.log('Cleaned code length:', cleanCode.length);

    // Initialize Mermaid once (following documentation best practices)
    if (!isExportInitialized) {
      console.log('Initializing Mermaid for export (one-time initialization)...');
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default', // Default theme as base
        securityLevel: 'loose',
        fontFamily: 'Arial, sans-serif',
        fontSize: 18, // Increased for better readability in PDF
        flowchart: {
          htmlLabels: false,
          curve: 'basis',
          useMaxWidth: false, // Don't constrain width for better quality
        },
        logLevel: 1,
      });
      isExportInitialized = true;
      console.log('Mermaid initialized for export');
    }

    // Inject light theme configuration into the diagram code
    // This is the recommended approach per Mermaid documentation
    const themedCode = injectThemeConfig(cleanCode, 'default');
    console.log('Theme configuration injected into diagram code');

    // Generate unique ID (must be valid CSS selector - no dots or special chars)
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000000);
    const id = `mermaid-export-${timestamp}-${randomNum}`;
    console.log('Rendering with ID:', id);

    // Validate syntax first
    try {
      const parseResult = await mermaid.parse(themedCode);
      console.log('Parse result:', parseResult);
    } catch (parseError) {
      console.error('Parse error:', parseError);
      throw new Error(`Invalid Mermaid syntax: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`);
    }

    // Render to SVG
    console.log('Calling mermaid.render...');
    const { svg } = await mermaid.render(id, themedCode);
    console.log('SVG rendered, length:', svg.length);

    // Return the raw SVG string - jsPDF's addSvgAsImage will handle it
    return svg;
  } catch (error) {
    console.error('Failed to render Mermaid diagram:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw new Error(
      `Mermaid rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}


/**
 * Get dimensions for image in PDF (maintains aspect ratio)
 */
export function calculateImageDimensions(
  imgWidth: number,
  imgHeight: number,
  maxWidth: number,
  maxHeight: number = 200
): { width: number; height: number } {
  const aspectRatio = imgWidth / imgHeight;

  let width = maxWidth;
  let height = width / aspectRatio;

  // If height exceeds max, scale down
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width, height };
}

/**
 * Convert SVG to high-resolution PNG data URL
 * This provides better quality than addSvgAsImage which uses low-res canvas
 */
export async function svgToPngDataUrl(svg: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create canvas at SVG's native resolution for maximum quality
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    // Create image from SVG using data URL to avoid CORS issues
    const img = new Image();

    // CRITICAL: Encode SVG as data URL directly (not Blob URL) to avoid tainting canvas
    const svgData = encodeURIComponent(svg);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${svgData}`;

    img.onload = () => {
      // Draw SVG to canvas at full resolution
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to PNG data URL (lossless, better than JPEG for diagrams)
      const pngDataUrl = canvas.toDataURL('image/png');
      resolve(pngDataUrl);
    };

    img.onerror = (error) => {
      reject(new Error(`Failed to load SVG as image: ${error}`));
    };

    img.src = dataUrl;
  });
}
