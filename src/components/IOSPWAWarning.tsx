import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, ExternalLink, Copy, Check } from 'lucide-react';

interface IOSPWAWarningProps {
  onDismiss?: () => void;
}

/**
 * IOSPWAWarning Component
 *
 * Warning banner displayed when iOS PWA standalone mode is detected,
 * explaining why voice recording is not available and how to access it.
 *
 * iOS Limitation:
 * getUserMedia API does not work in iOS PWAs running in standalone mode
 * due to Apple security restrictions. Users must use Safari browser mode.
 *
 * Features:
 * - Clear explanation of the issue
 * - Instructions to open in Safari
 * - Copy URL button
 * - Dismissible with localStorage persistence
 * - Glassmorphism design
 * - Dark mode support
 */
export default function IOSPWAWarning({ onDismiss }: IOSPWAWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Check if warning was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('ios-pwa-voice-warning-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  /**
   * Handle dismiss button click
   */
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('ios-pwa-voice-warning-dismissed', 'true');
    onDismiss?.();
  };

  /**
   * Copy current URL to clipboard
   */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  /**
   * Open current page in Safari
   */
  const handleOpenInSafari = () => {
    // On iOS, this will prompt to open in Safari
    window.location.href = window.location.href;
  };

  if (isDismissed) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 fade-in-0 duration-300">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-700 rounded-xl p-4 sm:p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-800/50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              Voice Recording Not Available in iOS App Mode
            </h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              Due to iOS security restrictions, voice recording is not supported when running as an installed app.
              To use voice features, please open this page in Safari browser.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleOpenInSafari}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700 text-white text-sm font-medium rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Safari</span>
              </button>

              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center justify-center space-x-2 px-4 py-2 border-2 border-yellow-300 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>

            {/* Help text */}
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-3">
              <strong>Tip:</strong> Open Safari, paste the URL, and use voice features there. You can add it to your home screen with browser display mode for full functionality.
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-yellow-100 dark:hover:bg-yellow-800/30"
            title="Dismiss warning"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
