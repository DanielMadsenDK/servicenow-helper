/**
 * Performance monitoring utilities for the ServiceNow Helper application
 */

// Extended PerformanceEntry interfaces for proper typing
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface NavigationTimingEntry extends PerformanceEntry {
  responseStart: number;
  requestStart: number;
}

export interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

export interface StreamingMetrics {
  connectionTime: number;
  firstChunkTime: number;
  totalChunks: number;
  averageChunkSize: number;
  totalStreamingTime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  };

  private observers: PerformanceObserver[] = [];
  private streamingMetrics: Map<string, StreamingMetrics> = new Map();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // First Contentful Paint
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.fcp = lastEntry.startTime;
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch {
      console.warn('FCP observer not supported');
    }

    // Largest Contentful Paint
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch {
      console.warn('LCP observer not supported');
    }

    // First Input Delay
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEventTiming;
        this.metrics.fid = lastEntry.processingStart - lastEntry.startTime;
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);
    } catch {
      console.warn('FID observer not supported');
    }

    // Cumulative Layout Shift
    try {
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as LayoutShiftEntry;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        });
        this.metrics.cls = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch {
      console.warn('CLS observer not supported');
    }

    // Time to First Byte (from navigation timing)
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as NavigationTimingEntry;
            this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart;
          }
        });
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    } catch {
      console.warn('Navigation observer not supported');
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Start tracking streaming performance
   */
  startStreamingSession(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('Invalid session ID provided to startStreamingSession');
      return;
    }

    this.streamingMetrics.set(sessionId, {
      connectionTime: Date.now(),
      firstChunkTime: 0,
      totalChunks: 0,
      averageChunkSize: 0,
      totalStreamingTime: 0,
    });
  }

  /**
   * Record streaming metrics
   */
  recordStreamingChunk(sessionId: string, chunkSize: number): void {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('Invalid session ID provided to recordStreamingChunk');
      return;
    }

    if (typeof chunkSize !== 'number' || chunkSize < 0 || !isFinite(chunkSize)) {
      console.warn('Invalid chunk size provided to recordStreamingChunk');
      return;
    }

    const metrics = this.streamingMetrics.get(sessionId);
    if (!metrics) {
      console.warn(`No streaming session found for ID: ${sessionId}`);
      return;
    }

    if (metrics.firstChunkTime === 0) {
      metrics.firstChunkTime = Date.now();
    }

    metrics.totalChunks++;
    metrics.averageChunkSize = ((metrics.averageChunkSize * (metrics.totalChunks - 1)) + chunkSize) / metrics.totalChunks;
  }

  /**
   * End streaming session and get metrics
   */
  endStreamingSession(sessionId: string): StreamingMetrics | null {
    if (!sessionId || typeof sessionId !== 'string') {
      console.warn('Invalid session ID provided to endStreamingSession');
      return null;
    }

    const metrics = this.streamingMetrics.get(sessionId);
    if (!metrics) {
      return null;
    }

    metrics.totalStreamingTime = Date.now() - metrics.connectionTime;
    this.streamingMetrics.delete(sessionId);

    return metrics;
  }

  /**
   * Log performance metrics to console (for debugging)
   */
  logMetrics(): void {
    console.group('🚀 Performance Metrics');
    console.log('Core Web Vitals:');
    console.log(`  FCP: ${this.metrics.fcp ? this.metrics.fcp.toFixed(2) + 'ms' : 'Not available'}`);
    console.log(`  LCP: ${this.metrics.lcp ? this.metrics.lcp.toFixed(2) + 'ms' : 'Not available'}`);
    console.log(`  FID: ${this.metrics.fid ? this.metrics.fid.toFixed(2) + 'ms' : 'Not available'}`);
    console.log(`  CLS: ${this.metrics.cls ? this.metrics.cls.toFixed(4) : 'Not available'}`);
    console.log(`  TTFB: ${this.metrics.ttfb ? this.metrics.ttfb.toFixed(2) + 'ms' : 'Not available'}`);
    console.groupEnd();
  }

  /**
   * Send metrics to analytics service (placeholder)
   */
  sendMetricsToAnalytics(): void {
    const metrics = this.getMetrics();

    // Placeholder for analytics integration
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: 'Performance Metrics',
        value: Math.round(metrics.lcp || 0),
        custom_map: {
          metric_fcp: metrics.fcp,
          metric_lcp: metrics.lcp,
          metric_fid: metrics.fid,
          metric_cls: metrics.cls,
          metric_ttfb: metrics.ttfb,
        },
      });
    }
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch {
        // Ignore errors when disconnecting
      }
    });
    this.observers = [];
    this.streamingMetrics.clear();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Utility functions for common performance measurements
export function measureExecutionTime<T>(fn: () => T, label: string): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

export async function measureAsyncExecutionTime<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  return getPerformanceMonitor();
}
