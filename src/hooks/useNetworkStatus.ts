import { useState, useEffect } from 'react';

import { testStreamingConnection } from '@/lib/streaming-client';

export interface NetworkStatus {
  isOnline: boolean;
  isStreamingAvailable: boolean;
  lastConnectionTest: Date | null;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

export const useNetworkStatus = (testInterval = 30000) => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isStreamingAvailable: true,
    lastConnectionTest: null,
    connectionQuality: 'excellent'
  });

  const testConnection = async (): Promise<void> => {
    try {
      const startTime = Date.now();
      const isStreamingOk = await testStreamingConnection();
      const responseTime = Date.now() - startTime;
      
      let quality: NetworkStatus['connectionQuality'];
      if (!navigator.onLine || !isStreamingOk) {
        quality = 'disconnected';
      } else if (responseTime < 500) {
        quality = 'excellent';
      } else if (responseTime < 2000) {
        quality = 'good';
      } else {
        quality = 'poor';
      }

      setNetworkStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isStreamingAvailable: isStreamingOk,
        lastConnectionTest: new Date(),
        connectionQuality: quality
      }));
    } catch (error) {
      console.error('Connection test failed:', error);
      setNetworkStatus(prev => ({
        ...prev,
        isStreamingAvailable: false,
        lastConnectionTest: new Date(),
        connectionQuality: 'disconnected'
      }));
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      testConnection(); // Test streaming when back online
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ 
        ...prev, 
        isOnline: false,
        isStreamingAvailable: false,
        connectionQuality: 'disconnected'
      }));
    };

    // Initial connection test
    testConnection();

    // Set up periodic testing
    const interval = setInterval(testConnection, testInterval);

    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [testInterval]);

  return {
    ...networkStatus,
    refreshConnection: testConnection,
    canAttemptStreaming: networkStatus.isOnline && networkStatus.isStreamingAvailable
  };
};