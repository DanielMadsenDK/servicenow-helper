/**
 * PDF Styling Configuration
 * Matches the ResultsSection prose styling for consistent visual appearance
 */

import { jsPDF } from 'jspdf';

// Color palette matching the application theme
export const PDFColors = {
  // Text colors
  textPrimary: '#334155', // slate-800
  textSecondary: '#64748b', // slate-600
  textHeading: '#1e293b', // slate-900

  // Heading colors
  h1Border: '#cbd5e1', // gray-300
  h2Background: '#eff6ff', // blue-50
  h2Border: '#3b82f6', // blue-500
  h2Text: '#1e40af', // blue-800
  h3Text: '#15803d', // green-700

  // Code colors
  codeText: '#7c3aed', // purple-700
  codeBackground: '#f3f4f6', // gray-100

  // Link colors
  linkText: '#2563eb', // blue-600

  // Blockquote
  blockquoteBorder: '#60a5fa', // blue-400
  blockquoteBackground: '#eff6ff', // blue-50
  blockquoteText: '#1e40af', // blue-800

  // Table
  tableBorder: '#d1d5db', // gray-300
  tableHeaderBackground: '#f3f4f6', // gray-100
  tableHeaderText: '#1f2937', // gray-800
} as const;

// Typography settings
export const PDFTypography = {
  fontSize: {
    h1: 24,
    h2: 20,
    h3: 16,
    h4: 14,
    body: 11,
    small: 9,
    code: 10,
  },
  lineHeight: {
    h1: 1.3,
    h2: 1.3,
    h3: 1.4,
    body: 1.6,
    code: 1.5,
  },
  margins: {
    page: 20,
    h1Top: 15,
    h1Bottom: 10,
    h2Top: 12,
    h2Bottom: 8,
    h3Top: 10,
    h3Bottom: 6,
    paragraph: 6,
    list: 4,
    code: 8,
  },
} as const;

// Page settings
export const PDFPageSettings = {
  width: 210, // A4 width in mm
  height: 297, // A4 height in mm
  margin: PDFTypography.margins.page,
} as const;

/**
 * Initialize PDF document with default settings
 */
export function initializePDF(): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  // Set default font
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(PDFTypography.fontSize.body);
  doc.setTextColor(PDFColors.textPrimary);

  return doc;
}

/**
 * Apply heading 1 styling
 */
export function applyH1Style(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.h1);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDFColors.textHeading);
}

/**
 * Apply heading 2 styling
 */
export function applyH2Style(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.h2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDFColors.h2Text);
}

/**
 * Apply heading 3 styling
 */
export function applyH3Style(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.h3);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDFColors.h3Text);
}

/**
 * Apply heading 4 styling
 */
export function applyH4Style(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.h4);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(PDFColors.textSecondary);
}

/**
 * Apply body text styling
 */
export function applyBodyStyle(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDFColors.textPrimary);
}

/**
 * Apply code styling
 */
export function applyCodeStyle(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.code);
  doc.setFont('courier', 'normal');
  doc.setTextColor(PDFColors.codeText);
}

/**
 * Apply link styling
 */
export function applyLinkStyle(doc: jsPDF): void {
  doc.setFontSize(PDFTypography.fontSize.body);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(PDFColors.linkText);
}

/**
 * Apply bold styling
 */
export function applyBoldStyle(doc: jsPDF): void {
  doc.setFont('helvetica', 'bold');
}

/**
 * Apply italic styling
 */
export function applyItalicStyle(doc: jsPDF): void {
  doc.setFont('helvetica', 'italic');
}

/**
 * Calculate usable page width
 */
export function getUsableWidth(): number {
  return PDFPageSettings.width - (2 * PDFPageSettings.margin);
}

/**
 * Calculate usable page height
 */
export function getUsableHeight(): number {
  return PDFPageSettings.height - (2 * PDFPageSettings.margin);
}

/**
 * Check if we need a new page
 */
export function needsNewPage(doc: jsPDF, currentY: number, requiredSpace: number): boolean {
  const maxY = PDFPageSettings.height - PDFPageSettings.margin;
  return currentY + requiredSpace > maxY;
}

/**
 * Add a new page and reset position
 */
export function addNewPage(doc: jsPDF): number {
  doc.addPage();
  return PDFPageSettings.margin;
}

/**
 * Draw a horizontal line (used for H1 underlines, table borders, etc.)
 */
export function drawHorizontalLine(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  color: string = PDFColors.h1Border
): void {
  doc.setDrawColor(color);
  doc.setLineWidth(0.5);
  doc.line(x, y, x + width, y);
}

/**
 * Draw a code block background
 */
export function drawCodeBlockBackground(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  doc.setFillColor(PDFColors.codeBackground);
  doc.rect(x, y, width, height, 'F');
}

/**
 * Draw a blockquote background with border
 */
export function drawBlockquoteBackground(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  // Background
  doc.setFillColor(PDFColors.blockquoteBackground);
  doc.rect(x, y, width, height, 'F');

  // Left border
  doc.setDrawColor(PDFColors.blockquoteBorder);
  doc.setLineWidth(2);
  doc.line(x, y, x, y + height);
}
