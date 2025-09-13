/**
 * Unit tests for Performance Monitor
 */

import { getPerformanceMonitor, PerformanceMetrics, StreamingMetrics } from '@/lib/performance-monitor';
import { setupTestEnvironment } from '../utils/test-utils';

describe('PerformanceMonitor', () => {
  let performanceMonitor: ReturnType<typeof getPerformanceMonitor>;
  let restoreConsole: () => void;
  let mockObserver: any;

  beforeEach(() => {
    const env = setupTestEnvironment();
    restoreConsole = env.restoreConsole;

    // Mock PerformanceObserver before initializing monitor
    mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
    };

    // Mock PerformanceObserver to return the same observer for all calls
    (global as any).PerformanceObserver = jest.fn().mockImplementation(() => mockObserver);

    performanceMonitor = getPerformanceMonitor();
  });

  afterEach(() => {
    restoreConsole();
    jest.clearAllMocks();
    performanceMonitor.destroy();

    // Reset the singleton for clean test isolation by importing and modifying the module
    const performanceMonitorModule = require('@/lib/performance-monitor');
    performanceMonitorModule.performanceMonitor = null;
  });

  describe('Core Web Vitals Tracking', () => {
    it('should initialize with default metrics', () => {
      const metrics = performanceMonitor.getMetrics();

      expect(metrics).toEqual({
        fcp: null,
        lcp: null,
        fid: null,
        cls: null,
        ttfb: null,
      });
    });

    it('should track First Contentful Paint', () => {
      // The observer should have been called during initialization
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['paint'] });
    });

    it('should track Largest Contentful Paint', () => {
      // The observer should have been called during initialization
      expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['largest-contentful-paint'] });
    });

    it('should handle observer errors gracefully', () => {
      // Mock PerformanceObserver to throw
      (global as any).PerformanceObserver = jest.fn().mockImplementation(() => {
        throw new Error('Observer not supported');
      });

      // Should not throw when creating monitor
      expect(() => {
        performanceMonitor = getPerformanceMonitor();
      }).not.toThrow();
    });
  });

  describe('Streaming Performance Tracking', () => {
    it('should start and end streaming session', () => {
      const sessionId = 'test-session';

      performanceMonitor.startStreamingSession(sessionId);

      // Simulate some streaming activity
      performanceMonitor.recordStreamingChunk(sessionId, 100);
      performanceMonitor.recordStreamingChunk(sessionId, 200);

      const metrics = performanceMonitor.endStreamingSession(sessionId);

      expect(metrics).toBeDefined();
      expect(metrics?.totalChunks).toBe(2);
      expect(metrics?.averageChunkSize).toBe(150);
      expect(metrics?.connectionTime).toBeGreaterThan(0);
      expect(metrics?.totalStreamingTime).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent sessions', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';

      performanceMonitor.startStreamingSession(session1);
      performanceMonitor.startStreamingSession(session2);

      performanceMonitor.recordStreamingChunk(session1, 50);
      performanceMonitor.recordStreamingChunk(session2, 75);

      const metrics1 = performanceMonitor.endStreamingSession(session1);
      const metrics2 = performanceMonitor.endStreamingSession(session2);

      expect(metrics1?.totalChunks).toBe(1);
      expect(metrics1?.averageChunkSize).toBe(50);
      expect(metrics2?.totalChunks).toBe(1);
      expect(metrics2?.averageChunkSize).toBe(75);
    });

    it('should return null for non-existent session', () => {
      const metrics = performanceMonitor.endStreamingSession('non-existent');
      expect(metrics).toBeNull();
    });

    it('should handle session cleanup properly', () => {
      const sessionId = 'cleanup-test';

      performanceMonitor.startStreamingSession(sessionId);
      performanceMonitor.recordStreamingChunk(sessionId, 100);

      // End session
      const metrics = performanceMonitor.endStreamingSession(sessionId);
      expect(metrics).toBeDefined();

      // Try to end again - should return null
      const nullMetrics = performanceMonitor.endStreamingSession(sessionId);
      expect(nullMetrics).toBeNull();
    });
  });

  describe('Performance Logging', () => {
    it('should log metrics without throwing', () => {
      const originalConsole = { ...console };
      const mockConsole = {
        group: jest.fn(),
        log: jest.fn(),
        groupEnd: jest.fn(),
      };

      (global as any).console = mockConsole;

      expect(() => {
        performanceMonitor.logMetrics();
      }).not.toThrow();

      expect(mockConsole.group).toHaveBeenCalledWith('🚀 Performance Metrics');
      expect(mockConsole.log).toHaveBeenCalledWith('Core Web Vitals:');

      // Restore console
      (global as any).console = originalConsole;
    });

    it('should send analytics data when gtag is available', () => {
      const mockGtag = jest.fn();
      (global as any).gtag = mockGtag;

      performanceMonitor.sendMetricsToAnalytics();

      expect(mockGtag).toHaveBeenCalledWith('event', 'web_vitals', expect.any(Object));

      delete (global as any).gtag;
    });

    it('should handle missing gtag gracefully', () => {
      delete (global as any).gtag;

      expect(() => {
        performanceMonitor.sendMetricsToAnalytics();
      }).not.toThrow();
    });
  });

  describe('Memory Management', () => {
    it('should clean up observers on destroy', () => {
      // The mockObserver from beforeEach should be used
      performanceMonitor.destroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it('should handle destroy on uninitialized monitor', () => {
      expect(() => {
        performanceMonitor.destroy();
      }).not.toThrow();
    });

    it('should clear streaming sessions on destroy', () => {
      performanceMonitor.startStreamingSession('test');
      performanceMonitor.destroy();

      // Should not have any sessions after destroy
      const metrics = performanceMonitor.endStreamingSession('test');
      expect(metrics).toBeNull();
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const monitor1 = getPerformanceMonitor();
      const monitor2 = getPerformanceMonitor();

      expect(monitor1).toBe(monitor2);
    });

    it('should maintain state across calls', () => {
      const monitor1 = getPerformanceMonitor();
      monitor1.startStreamingSession('shared-session');

      const monitor2 = getPerformanceMonitor();
      monitor2.recordStreamingChunk('shared-session', 100);

      const metrics = monitor1.endStreamingSession('shared-session');
      expect(metrics?.totalChunks).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid session IDs gracefully', () => {
      expect(() => {
        performanceMonitor.recordStreamingChunk('invalid-session', 100);
      }).not.toThrow();
    });

    it('should handle observer initialization failures', () => {
      // Mock a failing observer
      let callCount = 0;
      (global as any).PerformanceObserver = jest.fn().mockImplementation(() => {
        if (callCount++ === 0) {
          throw new Error('Observer failed');
        }
        return {
          observe: jest.fn(),
          disconnect: jest.fn(),
        };
      });

      expect(() => {
        performanceMonitor = getPerformanceMonitor();
      }).not.toThrow();
    });
  });
});
