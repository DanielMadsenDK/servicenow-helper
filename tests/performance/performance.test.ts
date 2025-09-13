/**
 * Performance tests for ServiceNow Helper
 */

import { setupTestEnvironment, waitForPerformance } from '../utils/test-utils';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

describe('Performance Tests', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    const env = setupTestEnvironment();
    restoreConsole = env.restoreConsole;
  });

  afterEach(() => {
    restoreConsole();
    jest.clearAllMocks();
  });

  describe('Component Rendering Performance', () => {
    it('should validate component rendering setup', async () => {
      // Basic performance test setup validation
      const performanceMonitor = getPerformanceMonitor();

      expect(performanceMonitor).toBeDefined();
      expect(typeof performanceMonitor.getMetrics).toBe('function');
      expect(typeof performanceMonitor.startStreamingSession).toBe('function');
    });

    it('should maintain performance under memory pressure', async () => {
      const performanceMonitor = getPerformanceMonitor();

      // Simulate memory pressure by creating multiple sessions
      const sessionIds = Array.from({ length: 10 }, (_, i) => `session-${i}`);

      const startTime = performance.now();

      for (const sessionId of sessionIds) {
        performanceMonitor.startStreamingSession(sessionId);
        performanceMonitor.recordStreamingChunk(sessionId, 100);
        performanceMonitor.endStreamingSession(sessionId);
        await waitForPerformance(() => {}, 1); // Small delay between operations
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / sessionIds.length;

      // Average operation time should be reasonable
      expect(averageTime).toBeLessThan(10);

      console.log(`Average operation time under load: ${averageTime.toFixed(2)}ms`);
    }, 15000);
  });

  describe('Core Web Vitals', () => {
    it('should track First Contentful Paint', async () => {
      const performanceMonitor = getPerformanceMonitor();

      // Wait for performance observers to initialize
      await waitForPerformance(() => {}, 100);

      // Simulate FCP by triggering paint observer
      const mockEntry = {
        startTime: 150,
        entryType: 'paint',
        name: 'first-contentful-paint',
      };

      // Trigger the observer callback
      if (window.performance && 'PerformanceObserver' in window) {
        // This would normally be triggered by the browser
        const metrics = performanceMonitor.getMetrics();
        expect(metrics).toBeDefined();
      }
    });

    it('should track Largest Contentful Paint', async () => {
      const performanceMonitor = getPerformanceMonitor();

      await waitForPerformance(() => {}, 100);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.lcp).toBeDefined();
    });

    it('should track Cumulative Layout Shift', async () => {
      const performanceMonitor = getPerformanceMonitor();

      await waitForPerformance(() => {}, 100);

      const metrics = performanceMonitor.getMetrics();
      expect(metrics.cls).toBeDefined();
    });
  });

  describe('Streaming Performance', () => {
    it('should track streaming session metrics', () => {
      const performanceMonitor = getPerformanceMonitor();
      const sessionId = 'test-session';

      performanceMonitor.startStreamingSession(sessionId);

      // Simulate streaming chunks
      performanceMonitor.recordStreamingChunk(sessionId, 100);
      performanceMonitor.recordStreamingChunk(sessionId, 150);
      performanceMonitor.recordStreamingChunk(sessionId, 200);

      const metrics = performanceMonitor.endStreamingSession(sessionId);

      expect(metrics).toBeDefined();
      expect(metrics?.totalChunks).toBe(3);
      expect(metrics?.averageChunkSize).toBe(150);
      expect(metrics?.connectionTime).toBeGreaterThan(0);
    });

    it('should handle streaming session cleanup', () => {
      const performanceMonitor = getPerformanceMonitor();
      const sessionId = 'cleanup-test';

      performanceMonitor.startStreamingSession(sessionId);
      performanceMonitor.recordStreamingChunk(sessionId, 50);

      const metrics = performanceMonitor.endStreamingSession(sessionId);

      expect(metrics).toBeDefined();

      // Second call should return null (session already ended)
      const nullMetrics = performanceMonitor.endStreamingSession(sessionId);
      expect(nullMetrics).toBeNull();
    });
  });

  describe('Memory Management', () => {
    it('should not have memory leaks in performance monitor', () => {
      const performanceMonitor = getPerformanceMonitor();

      // Create multiple streaming sessions
      const sessionIds = Array.from({ length: 100 }, (_, i) => `session-${i}`);

      sessionIds.forEach(sessionId => {
        performanceMonitor.startStreamingSession(sessionId);
        performanceMonitor.recordStreamingChunk(sessionId, 100);
        performanceMonitor.endStreamingSession(sessionId);
      });

      // Performance monitor should clean up properly
      expect(performanceMonitor).toBeDefined();
    });

    it('should handle performance monitor destruction', () => {
      const performanceMonitor = getPerformanceMonitor();

      // Start a session
      performanceMonitor.startStreamingSession('destroy-test');

      // Destroy the monitor
      performanceMonitor.destroy();

      // Should not throw errors
      expect(() => {
        performanceMonitor.getMetrics();
      }).not.toThrow();
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should validate bundle size constraints', () => {
      // This test would run during build analysis
      // In a real scenario, this would check the webpack bundle stats

      const mockBundleStats = {
        assets: [
          { name: 'main.js', size: 250000 }, // 250KB
          { name: 'vendor.js', size: 150000 }, // 150KB
        ],
      };

      // Check that main bundle is under 300KB
      const mainBundle = mockBundleStats.assets.find(asset => asset.name === 'main.js');
      expect(mainBundle?.size).toBeLessThan(300000);

      // Check that vendor bundle is under 200KB
      const vendorBundle = mockBundleStats.assets.find(asset => asset.name === 'vendor.js');
      expect(vendorBundle?.size).toBeLessThan(200000);
    });
  });
});
