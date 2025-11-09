import React, { useCallback, useEffect, useRef } from 'react';
import { Mic } from 'lucide-react';

import { VoiceRecordingState } from '@/types';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  recordingState: VoiceRecordingState;
  disabled: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
}

/**
 * VoiceRecordButton Component
 *
 * A press-and-hold button for voice recording with visual feedback.
 * Follows the WhatsApp-style interaction pattern:
 * - Press → Start recording
 * - Hold → Continue recording
 * - Release → Stop recording
 *
 * Visual states:
 * - Default: Blue gradient with microphone icon
 * - Recording: Red pulsing animation
 * - Disabled: Gray with cursor-not-allowed
 *
 * Features:
 * - Touch and mouse event support
 * - Accessibility (ARIA labels, keyboard support)
 * - Responsive design
 * - Design system compliance (chip-style, gradients, shadows)
 */
export default function VoiceRecordButton({
  isRecording,
  recordingState,
  disabled,
  onPressStart,
  onPressEnd,
}: VoiceRecordButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isPressedRef = useRef<boolean>(false);

  /**
   * Handle press start (mousedown / touchstart)
   */
  const handlePressStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || isPressedRef.current) return;

      e.preventDefault();
      isPressedRef.current = true;
      onPressStart();
    },
    [disabled, onPressStart]
  );

  /**
   * Handle press end (mouseup / touchend)
   */
  const handlePressEnd = useCallback(
    (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
      if (!isPressedRef.current) return;

      e.preventDefault();
      isPressedRef.current = false;
      onPressEnd();
    },
    [onPressEnd]
  );

  /**
   * Setup global event listeners for press end
   * This ensures we capture the release even if the user moves outside the button
   */
  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isPressedRef.current) {
        handlePressEnd(e);
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (isPressedRef.current) {
        handlePressEnd(e);
      }
    };

    // Add global listeners
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchcancel', handleGlobalTouchEnd);

    // Cleanup
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [handlePressEnd]);

  /**
   * Cleanup on unmount - ensure we stop recording if component unmounts
   */
  useEffect(() => {
    return () => {
      if (isPressedRef.current) {
        isPressedRef.current = false;
        onPressEnd();
      }
    };
  }, [onPressEnd]);

  // Determine button styling based on state
  const getButtonClasses = () => {
    const baseClasses =
      'relative inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2';

    if (disabled) {
      return `${baseClasses} bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed opacity-50 shadow-lg`;
    }

    if (isRecording) {
      return `${baseClasses} bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white shadow-2xl shadow-red-500/50 hover:shadow-red-500/60 scale-110 animate-pulse ring-4 ring-red-300/50 dark:ring-red-500/30 focus:ring-red-500`;
    }

    return `${baseClasses} bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-110 active:scale-105 focus:ring-blue-500 animate-[breathe_3s_ease-in-out_infinite]`;
  };

  // Accessibility label
  const getAriaLabel = () => {
    if (disabled) return 'Voice recording disabled';
    if (isRecording) return 'Recording voice... Release to stop';
    return 'Press and hold to record voice';
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className={getButtonClasses()}
      disabled={disabled}
      onMouseDown={handlePressStart}
      onTouchStart={handlePressStart}
      aria-label={getAriaLabel()}
      title={isRecording ? 'Recording... Release to stop' : 'Press and hold to record'}
    >
      <Mic className="w-5 h-5" />
      {isRecording && (
        <>
          {/* Recording pulse indicator */}
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
        </>
      )}
    </button>
  );
}
