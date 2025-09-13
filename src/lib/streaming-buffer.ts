/**
 * Efficient append-only string buffer for streaming content
 * Optimized for mobile performance with minimal garbage collection
 * Now supports incremental DOM updates for better performance
 */

export class StreamingBuffer {
  private chunks: string[] = [];
  private cachedContent: string = '';
  private lastCacheIndex: number = 0;
  private isDirty: boolean = false;
  private totalLength: number = 0;
  private incrementalUpdateCallback?: (newContent: string) => void;
  private lastRenderedLength: number = 0;

  /**
   * Append new content to the buffer
   * @param content - Content to append
   */
  append(content: string): void {
    if (!content) return;
    
    this.chunks.push(content);
    this.totalLength += content.length;
    this.isDirty = true;
  }

  /**
   * Get the complete content efficiently
   * Uses caching to avoid repeated joins
   */
  getContent(): string {
    if (!this.isDirty && this.lastCacheIndex === this.chunks.length) {
      return this.cachedContent;
    }

    // Only join new chunks since last cache
    if (this.lastCacheIndex < this.chunks.length) {
      const newChunks = this.chunks.slice(this.lastCacheIndex);
      this.cachedContent += newChunks.join('');
      this.lastCacheIndex = this.chunks.length;
    }

    this.isDirty = false;
    return this.cachedContent;
  }

  /**
   * Get content length without triggering full content rebuild
   * Uses incremental length tracking for optimal performance
   */
  getLength(): number {
    return this.totalLength;
  }

  /**
   * Check if buffer has content
   */
  hasContent(): boolean {
    return this.chunks.length > 0;
  }

  /**
   * Get number of chunks (for monitoring)
   */
  getChunkCount(): number {
    return this.chunks.length;
  }

  /**
   * Register a callback for incremental DOM updates
   * @param callback - Function to call when new content is available
   */
  setIncrementalUpdateCallback(callback: (newContent: string) => void): void {
    this.incrementalUpdateCallback = callback;
  }

  /**
   * Trigger incremental update if new content is available
   * Only updates DOM with newly added content since last render
   */
  triggerIncrementalUpdate(): void {
    if (!this.incrementalUpdateCallback || !this.isDirty) return;

    const currentContent = this.getContent();
    const newContentLength = currentContent.length - this.lastRenderedLength;

    if (newContentLength > 0) {
      const newContent = currentContent.slice(this.lastRenderedLength);
      this.incrementalUpdateCallback(newContent);
      this.lastRenderedLength = currentContent.length;
    }
  }

  /**
   * Get new content since last render for incremental updates
   */
  getIncrementalContent(): string {
    if (!this.isDirty) return '';

    const currentContent = this.getContent();
    const newContent = currentContent.slice(this.lastRenderedLength);
    this.lastRenderedLength = currentContent.length;
    return newContent;
  }

  /**
   * Clear all content and reset buffer
   */
  clear(): void {
    this.chunks = [];
    this.cachedContent = '';
    this.lastCacheIndex = 0;
    this.isDirty = false;
    this.totalLength = 0;
    this.lastRenderedLength = 0;
    this.incrementalUpdateCallback = undefined;
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    return {
      chunkCount: this.chunks.length,
      totalLength: this.totalLength,
      cachedContentLength: this.cachedContent.length,
      isDirty: this.isDirty,
      cacheEfficiency: this.lastCacheIndex / (this.chunks.length || 1),
      lastRenderedLength: this.lastRenderedLength,
      incrementalUpdateSupport: !!this.incrementalUpdateCallback
    };
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    const stats = this.getStats();
    const memoryUsage = (stats.cachedContentLength * 2) / 1024; // Rough estimate in KB (2 bytes per char)
    const cacheHitRatio = stats.cacheEfficiency;

    return {
      ...stats,
      memoryUsageKB: Math.round(memoryUsage * 100) / 100,
      cacheHitRatio: Math.round(cacheHitRatio * 100) / 100,
      optimizationStatus: {
        incrementalUpdates: stats.incrementalUpdateSupport,
        virtualScrollingEligible: stats.totalLength > 2000,
        smartBatchingActive: true
      }
    };
  }
}

/**
 * Mobile device detection utility
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  
  return isMobile || isTablet || isSmallScreen;
};

/**
 * Safari detection utility
 * Uses modern detection pattern that excludes Chrome and Android browsers
 */
export const isSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return /^((?!chrome|android).)*safari/i.test(userAgent);
};

/**
 * Content type analysis for smart batching
 */
export const analyzeContentType = (content: string): 'code' | 'text' | 'mixed' => {
  if (!content) return 'text';

  const codePatterns = [
    /```[\s\S]*?```/g, // Code blocks
    /`[^`]+`/g, // Inline code
    /\b(function|const|let|var|if|for|while|class|import|export)\b/g, // Programming keywords
    /[{}();[\]]/g, // Programming symbols
    /\b(true|false|null|undefined)\b/g, // Programming literals
  ];

  let codeScore = 0;
  const totalLength = content.length;

  for (const pattern of codePatterns) {
    const matches = content.match(pattern);
    if (matches) {
      codeScore += matches.join('').length;
    }
  }

  const codeRatio = codeScore / totalLength;

  if (codeRatio > 0.3) return 'code'; // More than 30% code-like content
  if (codeRatio > 0.1) return 'mixed'; // Some code content
  return 'text'; // Mostly text content
};

/**
 * Get smart batching interval based on device capabilities and content type
 * Dynamically adjusts intervals to optimize performance for different content types
 */
export const getSmartBatchInterval = (content: string = '', baseInterval?: number): number => {
  if (typeof window === 'undefined') return 75;

  const mobile = isMobileDevice();
  const safari = isSafari();
  const contentType = analyzeContentType(content);

  // Use provided base interval or get device-specific default
  const deviceBaseInterval = baseInterval || getOptimalBatchInterval();

  // Adjust interval based on content type
  let multiplier = 1;

  switch (contentType) {
    case 'code':
      // Code content benefits from longer intervals to reduce expensive re-renders
      multiplier = 1.5;
      break;
    case 'mixed':
      // Mixed content gets moderate adjustment
      multiplier = 1.2;
      break;
    case 'text':
    default:
      // Text content can use faster intervals for better responsiveness
      multiplier = 0.8;
      break;
  }

  // Apply device-specific adjustments
  if (mobile && safari) {
    // iOS Safari needs longer intervals to prevent timeouts
    multiplier *= 1.2;
  } else if (mobile) {
    // Other mobile browsers
    multiplier *= 1.1;
  }

  const adjustedInterval = Math.round(deviceBaseInterval * multiplier);

  // Ensure reasonable bounds
  return Math.max(50, Math.min(adjustedInterval, 300));
};

/**
 * Get optimal batching interval based on device capabilities
 * Optimized intervals to prevent mobile connection timeouts while maintaining performance
 */
export const getOptimalBatchInterval = (): number => {
  if (typeof window === 'undefined') return 75;

  const mobile = isMobileDevice();
  const safari = isSafari();

  // Reduced intervals for mobile to prevent connection timeouts and ensure complete content delivery
  // The previous 250-300ms intervals were causing stream termination at ~1000 characters
  if (mobile && safari) return 150; // iOS Safari - reduced from 300ms to prevent timeout
  if (mobile) return 100; // Other mobile browsers - reduced from 250ms for better responsiveness
  return 75; // Desktop default - keep responsive for real-time display
};

/**
 * Performance monitoring for streaming operations
 */
export class StreamingPerformanceMonitor {
  private appendTimes: number[] = [];
  private renderTimes: number[] = [];
  private maxSamples = 50; // Keep only recent samples

  recordAppend(duration: number): void {
    this.appendTimes.push(duration);
    if (this.appendTimes.length > this.maxSamples) {
      this.appendTimes.shift();
    }
  }

  recordRender(duration: number): void {
    this.renderTimes.push(duration);
    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }
  }

  getStats() {
    const getAverage = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : 0;
    const getMax = (arr: number[]) => arr.length > 0 ? Math.max(...arr) : 0;

    return {
      appendAvg: Math.round(getAverage(this.appendTimes) * 100) / 100,
      appendMax: Math.round(getMax(this.appendTimes) * 100) / 100,
      renderAvg: Math.round(getAverage(this.renderTimes) * 100) / 100,
      renderMax: Math.round(getMax(this.renderTimes) * 100) / 100,
      sampleCount: Math.min(this.appendTimes.length, this.renderTimes.length)
    };
  }

  reset(): void {
    this.appendTimes = [];
    this.renderTimes = [];
  }
}
