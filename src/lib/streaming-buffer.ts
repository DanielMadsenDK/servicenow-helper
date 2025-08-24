/**
 * Efficient append-only string buffer for streaming content
 * Optimized for mobile performance with minimal garbage collection
 */

export class StreamingBuffer {
  private chunks: string[] = [];
  private cachedContent: string = '';
  private lastCacheIndex: number = 0;
  private isDirty: boolean = false;
  private totalLength: number = 0;

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
   * Clear all content and reset buffer
   */
  clear(): void {
    this.chunks = [];
    this.cachedContent = '';
    this.lastCacheIndex = 0;
    this.isDirty = false;
    this.totalLength = 0;
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
      cacheEfficiency: this.lastCacheIndex / (this.chunks.length || 1)
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
 * Get optimal batching interval based on device capabilities
 */
export const getOptimalBatchInterval = (): number => {
  if (typeof window === 'undefined') return 75;
  
  const mobile = isMobileDevice();
  const safari = isSafari();
  
  // Longer intervals for mobile to reduce processing overhead
  if (mobile && safari) return 200; // iOS Safari needs longer intervals
  if (mobile) return 150; // Other mobile browsers
  return 75; // Desktop default
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