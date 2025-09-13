'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

import { usePWAInstall } from '@/hooks/usePWAInstall';

interface NetworkStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function NetworkStatusIndicator({
  className = '',
  showDetails = false
}: NetworkStatusIndicatorProps) {
  const { isOnline } = usePWAInstall();
  const [showTooltip, setShowTooltip] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return;
    }

    // Check connection quality using navigator.connection if available
    const checkConnectionQuality = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          const downlink = connection.downlink;

          if (effectiveType === '4g' && downlink >= 5) {
            setConnectionQuality('good');
          } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink < 5)) {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('good');
          }
        }
      }
    };

    checkConnectionQuality();

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => checkConnectionQuality();
      connection.addEventListener('change', handleConnectionChange);
      return () => connection.removeEventListener('change', handleConnectionChange);
    }
  }, [isOnline]);

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />;
    }

    switch (connectionQuality) {
      case 'good':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'poor':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    switch (connectionQuality) {
      case 'good':
        return 'Online';
      case 'poor':
        return 'Slow connection';
      default:
        return 'Connecting...';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }

    switch (connectionQuality) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'poor':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (!showDetails) {
    return (
      <div
        className={`relative ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getStatusIcon()}

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50">
            {getStatusText()}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusIcon()}

      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </div>

      {!isOnline && (
        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
          <AlertTriangle className="w-3 h-3" />
          <span>Limited functionality</span>
        </div>
      )}
    </div>
  );
}

// Hook for network status with additional utilities
export function useNetworkStatus() {
  const { isOnline } = usePWAInstall();
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const [connectionInfo, setConnectionInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({});

  useEffect(() => {
    if (!isOnline) {
      setConnectionQuality('offline');
      return;
    }

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const info = {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          };
          setConnectionInfo(info);

          // Determine quality based on connection info
          if (info.effectiveType === '4g' && info.downlink >= 5) {
            setConnectionQuality('good');
          } else if (info.effectiveType === '3g' || (info.effectiveType === '4g' && info.downlink < 5)) {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('good');
          }
        }
      }
    };

    updateConnectionInfo();

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, [isOnline]);

  return {
    isOnline,
    connectionQuality,
    connectionInfo,
    isSlowConnection: connectionQuality === 'poor',
    isOffline: !isOnline,
  };
}
