/**
 * Export Utilities
 * Handles exporting answers as Markdown and PDF files
 */

import { jsPDF } from 'jspdf';
import {
  initializePDF,
  applyH1Style,
  applyH2Style,
  applyH3Style,
  applyH4Style,
  applyBodyStyle,
  applyCodeStyle,
  applyBoldStyle,
  applyItalicStyle,
  PDFPageSettings,
  PDFTypography,
  PDFColors,
  getUsableWidth,
  needsNewPage,
  addNewPage,
  drawHorizontalLine,
  drawCodeBlockBackground,
  drawBlockquoteBackground,
} from './pdf-styles';

export type ExportFormat = 'markdown' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filename: string;
  includeQuestion: boolean;
  question?: string;
  answer: string;
}

/**
 * Generate default filename with timestamp
 */
export function getDefaultFilename(format: ExportFormat): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const extension = format === 'pdf' ? 'pdf' : 'md';
  return `ServiceNow-Helper-${timestamp}.${extension}`;
}

/**
 * Format content for export (combines question and answer)
 */
export function formatExportContent(question: string | undefined, answer: string, includeQuestion: boolean): string {
  if (!includeQuestion || !question) {
    return answer;
  }

  return `# Question\n\n${question}\n\n# Answer\n\n${answer}`;
}

/**
 * Sanitize filename to prevent path traversal and invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 255);
}

/**
 * Detect if File System Access API is supported
 */
export function detectFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/**
 * Save file using File System Access API (preferred method)
 */
async function saveWithFilePicker(
  content: string | Blob,
  filename: string,
  mimeType: string
): Promise<void> {
  if (!detectFileSystemAccess()) {
    throw new Error('File System Access API not supported');
  }

  try {
    const extension = filename.split('.').pop() || 'txt';

    // @ts-expect-error - showSaveFilePicker is not yet in TypeScript lib
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [
        {
          description: `${extension.toUpperCase()} file`,
          accept: { [mimeType]: [`.${extension}`] },
        },
      ],
    });

    const writable = await handle.createWritable();

    if (typeof content === 'string') {
      await writable.write(content);
    } else {
      await writable.write(content);
    }

    await writable.close();
  } catch (error) {
    // User cancelled the dialog or error occurred
    if ((error as Error).name === 'AbortError') {
      throw new Error('Save cancelled by user');
    }
    throw error;
  }
}

/**
 * Save file using traditional download method (fallback)
 */
function saveWithDownload(content: string | Blob, filename: string, mimeType: string): void {
  const blob = typeof content === 'string'
    ? new Blob([content], { type: mimeType })
    : content;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Export content as Markdown file
 */
export async function exportAsMarkdown(options: ExportOptions): Promise<void> {
  const content = formatExportContent(options.question, options.answer, options.includeQuestion);
  const filename = sanitizeFilename(options.filename);
  const mimeType = 'text/markdown';

  try {
    // Try File System Access API first
    if (detectFileSystemAccess()) {
      await saveWithFilePicker(content, filename, mimeType);
    } else {
      // Fallback to download
      saveWithDownload(content, filename, mimeType);
    }
  } catch (error) {
    if ((error as Error).message === 'Save cancelled by user') {
      throw error;
    }
    // If File System Access fails, use download fallback
    saveWithDownload(content, filename, mimeType);
  }
}

/**
 * Parse markdown and render to PDF
 */
function renderMarkdownToPDF(doc: jsPDF, content: string): void {
  let currentY: number = PDFPageSettings.margin;
  const usableWidth = getUsableWidth();
  const leftMargin = PDFPageSettings.margin;

  const lines = content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check for headings
    if (line.startsWith('# ')) {
      // H1
      const text = line.substring(2).trim();
      if (needsNewPage(doc, currentY, 15)) {
        currentY = addNewPage(doc);
      }

      currentY += PDFTypography.margins.h1Top;
      applyH1Style(doc);
      const splitText = doc.splitTextToSize(text, usableWidth);
      doc.text(splitText, leftMargin, currentY);
      currentY += splitText.length * 8;

      // Draw underline
      drawHorizontalLine(doc, leftMargin, currentY + 2, usableWidth);
      currentY += PDFTypography.margins.h1Bottom;

      applyBodyStyle(doc);
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      // H2
      const text = line.substring(3).trim();
      if (needsNewPage(doc, currentY, 12)) {
        currentY = addNewPage(doc);
      }

      currentY += PDFTypography.margins.h2Top;
      applyH2Style(doc);
      const splitText = doc.splitTextToSize(text, usableWidth - 6);

      // Draw background
      const textHeight = splitText.length * 6 + 4;
      doc.setFillColor(PDFColors.h2Background);
      doc.rect(leftMargin, currentY - 4, usableWidth, textHeight, 'F');

      // Draw left border
      doc.setDrawColor(PDFColors.h2Border);
      doc.setLineWidth(2);
      doc.line(leftMargin, currentY - 4, leftMargin, currentY - 4 + textHeight);

      doc.text(splitText, leftMargin + 4, currentY);
      currentY += splitText.length * 6 + PDFTypography.margins.h2Bottom;

      applyBodyStyle(doc);
      i++;
      continue;
    }

    if (line.startsWith('### ')) {
      // H3
      const text = line.substring(4).trim();
      if (needsNewPage(doc, currentY, 10)) {
        currentY = addNewPage(doc);
      }

      currentY += PDFTypography.margins.h3Top;
      applyH3Style(doc);
      const splitText = doc.splitTextToSize(text, usableWidth);
      doc.text(splitText, leftMargin, currentY);
      currentY += splitText.length * 5 + PDFTypography.margins.h3Bottom;

      applyBodyStyle(doc);
      i++;
      continue;
    }

    if (line.startsWith('#### ')) {
      // H4
      const text = line.substring(5).trim();
      if (needsNewPage(doc, currentY, 8)) {
        currentY = addNewPage(doc);
      }

      applyH4Style(doc);
      const splitText = doc.splitTextToSize(text, usableWidth);
      doc.text(splitText, leftMargin, currentY);
      currentY += splitText.length * 4 + 4;

      applyBodyStyle(doc);
      i++;
      continue;
    }

    // Check for code blocks
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++; // Skip the opening ```

      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip the closing ```

      // Calculate code block height
      const codeHeight = codeLines.length * 5 + 4;

      if (needsNewPage(doc, currentY, codeHeight + 10)) {
        currentY = addNewPage(doc);
      }

      // Draw code background
      drawCodeBlockBackground(doc, leftMargin, currentY - 2, usableWidth, codeHeight);

      applyCodeStyle(doc);
      codeLines.forEach((codeLine) => {
        const splitCode = doc.splitTextToSize(codeLine || ' ', usableWidth - 4);
        doc.text(splitCode, leftMargin + 2, currentY);
        currentY += splitCode.length * 4.5;
      });
      currentY += PDFTypography.margins.code;

      applyBodyStyle(doc);
      continue;
    }

    // Check for blockquotes
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      let j = i;

      while (j < lines.length && lines[j].startsWith('> ')) {
        quoteLines.push(lines[j].substring(2));
        j++;
      }

      const quoteText = quoteLines.join(' ');
      const splitQuote = doc.splitTextToSize(quoteText, usableWidth - 8);
      const quoteHeight = splitQuote.length * 5 + 4;

      if (needsNewPage(doc, currentY, quoteHeight + 8)) {
        currentY = addNewPage(doc);
      }

      drawBlockquoteBackground(doc, leftMargin, currentY - 2, usableWidth, quoteHeight);

      doc.setTextColor(PDFColors.blockquoteText);
      doc.setFont('helvetica', 'italic');
      doc.text(splitQuote, leftMargin + 6, currentY);
      currentY += splitQuote.length * 5 + 6;

      applyBodyStyle(doc);
      i = j;
      continue;
    }

    // Check for unordered lists
    if (line.match(/^[\-\*]\s/)) {
      const text = line.substring(2).trim();
      if (needsNewPage(doc, currentY, 8)) {
        currentY = addNewPage(doc);
      }

      const splitText = doc.splitTextToSize(text, usableWidth - 8);
      doc.text('•', leftMargin + 2, currentY);
      doc.text(splitText, leftMargin + 6, currentY);
      currentY += splitText.length * 5 + PDFTypography.margins.list;
      i++;
      continue;
    }

    // Check for ordered lists
    if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        const number = match[1];
        const text = match[2].trim();

        if (needsNewPage(doc, currentY, 8)) {
          currentY = addNewPage(doc);
        }

        const splitText = doc.splitTextToSize(text, usableWidth - 10);
        doc.text(`${number}.`, leftMargin + 2, currentY);
        doc.text(splitText, leftMargin + 8, currentY);
        currentY += splitText.length * 5 + PDFTypography.margins.list;
      }
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      currentY += 4;
      i++;
      continue;
    }

    // Regular paragraph with inline formatting
    if (needsNewPage(doc, currentY, 10)) {
      currentY = addNewPage(doc);
    }

    applyBodyStyle(doc);
    const splitText = doc.splitTextToSize(line, usableWidth);
    doc.text(splitText, leftMargin, currentY);
    currentY += splitText.length * 5 + PDFTypography.margins.paragraph;
    i++;
  }
}

/**
 * Export content as PDF file
 */
export async function exportAsPDF(options: ExportOptions): Promise<void> {
  const content = formatExportContent(options.question, options.answer, options.includeQuestion);
  const filename = sanitizeFilename(options.filename);
  const mimeType = 'application/pdf';

  // Initialize PDF
  const doc = initializePDF();

  // Render markdown content to PDF
  renderMarkdownToPDF(doc, content);

  // Generate PDF blob
  const pdfBlob = doc.output('blob');

  try {
    // Try File System Access API first
    if (detectFileSystemAccess()) {
      await saveWithFilePicker(pdfBlob, filename, mimeType);
    } else {
      // Fallback to download
      saveWithDownload(pdfBlob, filename, mimeType);
    }
  } catch (error) {
    if ((error as Error).message === 'Save cancelled by user') {
      throw error;
    }
    // If File System Access fails, use download fallback
    saveWithDownload(pdfBlob, filename, mimeType);
  }
}

/**
 * Main export function that routes to appropriate handler
 */
export async function exportAnswer(options: ExportOptions): Promise<void> {
  if (options.format === 'markdown') {
    await exportAsMarkdown(options);
  } else if (options.format === 'pdf') {
    await exportAsPDF(options);
  } else {
    throw new Error(`Unsupported export format: ${options.format}`);
  }
}
