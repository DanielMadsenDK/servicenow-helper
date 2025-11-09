import React, { useEffect, useRef, useCallback } from 'react';
import { X, Mic, Send } from 'lucide-react';

interface VoiceRecordingModalProps {
  isOpen: boolean;
  duration: number; // in seconds
  onSend: () => void;
  onCancel: () => void;
}

/**
 * VoiceRecordingModal Component
 *
 * Modal displayed after voice recording stops (when voice_auto_send is disabled).
 * Shows recording duration and provides Send/Cancel actions.
 *
 * Features:
 * - Glassmorphism design following project standards
 * - Animated waveform visualization
 * - Timer display (MM:SS format)
 * - Keyboard support (Enter to send, Escape to cancel)
 * - Accessibility (ARIA labels, focus management)
 * - Dark mode support
 */
export default function VoiceRecordingModal({
  isOpen,
  duration,
  onSend,
  onCancel,
}: VoiceRecordingModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  /**
   * Format duration as MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSend();
      }
    },
    [isOpen, onCancel, onSend]
  );

  /**
   * Setup keyboard event listeners
   */
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  /**
   * Focus management - trap focus in modal
   */
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Focus the modal container
      modalRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Prevent body scroll when modal is open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-recording-title"
    >
      <div
        ref={modalRef}
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-gray-700/50 w-full max-w-md animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="voice-recording-title"
            className="text-xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Voice Recording
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Cancel recording"
            aria-label="Cancel recording"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-8">
          {/* Recording visualization */}
          <div className="flex flex-col items-center space-y-6">
            {/* Microphone icon with pulse animation */}
            <div className="relative">
              <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/30">
                <Mic className="w-12 h-12 text-white" />
              </div>
              {/* Pulse rings */}
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-30"></span>
              </span>
            </div>

            {/* Duration display */}
            <div className="text-center">
              <div className="text-5xl font-mono font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(duration)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Recording duration
              </p>
            </div>

            {/* Waveform visualization (simplified bars) */}
            <div className="flex items-center justify-center space-x-1 h-12">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-blue-500 to-indigo-600 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: `${800 + Math.random() * 400}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSend}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2 font-medium"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
}
