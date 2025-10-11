'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor } from 'lucide-react';

import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallPromptProps {
  className?: string;
}

export default function PWAInstallPrompt({ className = '' }: PWAInstallPromptProps) {
  const { canInstall, isOnline, install } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the prompt
    try {
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        // Show again after 24 hours
        if (Date.now() - dismissedTime > oneDay) {
          localStorage.removeItem('pwa-install-dismissed');
          setIsDismissed(false);
        } else {
          setIsDismissed(true);
        }
      }
    } catch (error) {
      console.warn('Failed to access localStorage for PWA install state:', error);
      // Continue with default state if localStorage is unavailable
      setIsDismissed(false);
    }

    // Show prompt after 30 seconds if installable and not dismissed
    const timer = setTimeout(() => {
      if (canInstall && isOnline && !isDismissed) {
        setIsVisible(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [canInstall, isOnline, isDismissed]);

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    try {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    } catch (error) {
      console.warn('Failed to store PWA install dismiss state:', error);
      // Continue with in-memory state even if storage fails
    }
  };

  if (!isVisible || !canInstall) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 ${className}`}>
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 p-4 animate-in slide-in-from-bottom-2 fade-in-0 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Install ServiceNow Helper
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Get the full app experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-1"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Smartphone className="w-3 h-3" />
            <span>Works offline</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Monitor className="w-3 h-3" />
            <span>Desktop & mobile</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            Not now
          </button>
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            ⚠️ Install when back online for the best experience
          </div>
        )}
      </div>
    </div>
  );
}

// Hook for programmatic PWA installation
export function usePWAInstallPrompt() {
  const { canInstall, install, dismiss } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);

  const promptInstall = () => {
    if (canInstall) {
      setShowPrompt(true);
    }
  };

  const hidePrompt = () => {
    setShowPrompt(false);
    dismiss();
  };

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
    return success;
  };

  return {
    canInstall,
    showPrompt,
    promptInstall,
    hidePrompt,
    install: handleInstall,
  };
}
