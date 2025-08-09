import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Mock the streaming client
jest.mock('@/lib/streaming-client', () => ({
  testStreamingConnection: jest.fn(),
}));

const { testStreamingConnection } = require('@/lib/streaming-client');

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Reset navigator properties to defaults
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    // Mock successful streaming connection by default
    testStreamingConnection.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should return initial network status', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current).toEqual({
      isOnline: true,
      isStreamingAvailable: true,
      lastConnectionTest: null,
      connectionQuality: 'excellent',
      refreshConnection: expect.any(Function),
      canAttemptStreaming: true,
    });
  });

  it('should handle offline status', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

    const { result } = renderHook(() => useNetworkStatus());

    expect(result.current.isOnline).toBe(false);
  });

  it('should test streaming connection on initialization', async () => {
    testStreamingConnection.mockResolvedValue(true);

    await act(async () => {
      renderHook(() => useNetworkStatus());
      // Wait for the initial connection test
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Allow promises to resolve
    });

    expect(testStreamingConnection).toHaveBeenCalled();
  });

  it('should handle streaming connection test failure', async () => {
    testStreamingConnection.mockRejectedValue(new Error('Network error'));

    let result: any;
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus());
      result = hook.result;
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    expect(result.current.isStreamingAvailable).toBe(false);
    expect(result.current.connectionQuality).toBe('disconnected');
  });

  it('should handle connection quality based on response time', async () => {
    // Mock excellent connection (fast response)
    testStreamingConnection.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve(true), 100); // 100ms response
      });
    });

    let result: any;
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus());
      result = hook.result;
      jest.advanceTimersByTime(200);
      await Promise.resolve();
    });

    expect(result.current.connectionQuality).toBe('excellent');
  });

  it('should handle event listeners for online/offline changes', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useNetworkStatus());

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  it('should react to online/offline events', async () => {
    let result: any;
    
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus());
      result = hook.result;
      // Wait for initial connection test
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    expect(result.current.isOnline).toBe(true);

    // Simulate going offline
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOnline).toBe(false);
    expect(result.current.isStreamingAvailable).toBe(false);
    expect(result.current.connectionQuality).toBe('disconnected');

    // Simulate coming back online
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      window.dispatchEvent(new Event('online'));
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    expect(result.current.isOnline).toBe(true);
  });

  it('should run periodic connection tests', async () => {
    let result: any;
    
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus(1000)); // 1 second interval
      result = hook.result;
    });

    // Initial call
    expect(testStreamingConnection).toHaveBeenCalledTimes(1);

    // Advance timer by 1 second
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(testStreamingConnection).toHaveBeenCalledTimes(2);

    // Advance timer by another second
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(testStreamingConnection).toHaveBeenCalledTimes(3);
  });

  it('should provide refreshConnection function', async () => {
    let result: any;
    
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus());
      result = hook.result;
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.refreshConnection();
    });

    expect(testStreamingConnection).toHaveBeenCalledTimes(2); // Initial + manual refresh
  });

  it('should calculate canAttemptStreaming correctly', async () => {
    let result: any;
    
    await act(async () => {
      const hook = renderHook(() => useNetworkStatus());
      result = hook.result;
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    // Should be true when online and streaming available
    expect(result.current.canAttemptStreaming).toBe(true);

    // Should be false when offline
    await act(async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.canAttemptStreaming).toBe(false);
  });
});