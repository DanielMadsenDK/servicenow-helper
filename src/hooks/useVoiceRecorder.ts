import { useState, useRef, useCallback, useEffect } from 'react';

import { VoiceRecordingState } from '@/types';
import type { PlatformCapabilities, AudioFormat } from '@/types';
import { detectPlatformCapabilities, getMediaRecorderMimeType } from '@/lib/platform-detection';

// Maximum recording duration: 2 minutes (120 seconds)
const MAX_RECORDING_DURATION_MS = 120000;

interface UseVoiceRecorderReturn {
  // State
  recordingState: VoiceRecordingState;
  isRecording: boolean;
  recordingDuration: number; // in seconds
  error: string | null;
  audioBlob: Blob | null;
  base64Audio: string | null;
  capabilities: PlatformCapabilities;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  clearError: () => void;
}

/**
 * Custom hook for voice recording with platform-specific support
 *
 * Features:
 * - Platform detection (iOS, Android, Desktop)
 * - Automatic audio format selection (webm for Android, mp4 for iOS)
 * - MediaRecorder API with proper codec support
 * - Microphone permission handling
 * - Recording timer with max duration
 * - Base64 conversion for API upload
 * - Comprehensive error handling with user-friendly messages
 *
 * iOS Limitations:
 * - getUserMedia not available in standalone PWA mode
 * - Must use mp4/aac codec instead of webm
 * - May require MediaRecorder experimental feature enabled
 *
 * @returns Voice recorder state and control functions
 */
export function useVoiceRecorder(): UseVoiceRecorderReturn {
  // Platform capabilities (detected once on mount)
  const [capabilities, setCapabilities] = useState<PlatformCapabilities>({
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    supportsMediaRecorder: false,
    supportsGetUserMedia: false,
    preferredAudioFormat: 'webm',
    canUseVoiceInput: false,
  });

  // Recording state
  const [recordingState, setRecordingState] = useState<VoiceRecordingState>(VoiceRecordingState.IDLE);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [base64Audio, setBase64Audio] = useState<string | null>(null);

  // Refs for MediaRecorder and streams
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Detect platform capabilities on mount
  useEffect(() => {
    const detectedCapabilities = detectPlatformCapabilities();
    setCapabilities(detectedCapabilities);

    if (process.env.NODE_ENV === 'development') {
      console.log('[useVoiceRecorder] Platform capabilities:', detectedCapabilities);
    }
  }, []);

  /**
   * Cleanup function to stop recording and release resources
   */
  const cleanup = useCallback(() => {
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop all media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Clear timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current);
      maxDurationTimeoutRef.current = null;
    }

    // Reset refs
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
  }, []);

  /**
   * Converts audio blob to base64 string
   */
  const convertBlobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Remove data URL prefix (data:audio/webm;base64,)
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert audio to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(blob);
    });
  }, []);

  /**
   * Starts voice recording
   */
  const startRecording = useCallback(async () => {
    try {
      // Reset state
      setError(null);
      setAudioBlob(null);
      setBase64Audio(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];

      // Check platform capabilities
      if (!capabilities.canUseVoiceInput) {
        const errorMsg = capabilities.warning || 'Voice recording is not supported on this device/browser';
        setError(errorMsg);
        setRecordingState(VoiceRecordingState.ERROR);
        return;
      }

      // Request microphone permission
      setRecordingState(VoiceRecordingState.RECORDING);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        mediaStreamRef.current = stream;

        // Get the appropriate MIME type for this platform
        const mimeType = getMediaRecorderMimeType(capabilities);

        // Create MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
        });

        mediaRecorderRef.current = mediaRecorder;

        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop event
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          setAudioBlob(audioBlob);

          // Convert to base64
          try {
            const base64 = await convertBlobToBase64(audioBlob);
            setBase64Audio(base64);
            setRecordingState(VoiceRecordingState.IDLE);
          } catch (conversionError) {
            console.error('[useVoiceRecorder] Base64 conversion error:', conversionError);
            setError('Failed to process audio recording');
            setRecordingState(VoiceRecordingState.ERROR);
          }

          cleanup();
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
          console.error('[useVoiceRecorder] MediaRecorder error:', event);
          setError('An error occurred during recording');
          setRecordingState(VoiceRecordingState.ERROR);
          cleanup();
        };

        // Start recording
        mediaRecorder.start();
        startTimeRef.current = Date.now();

        // Start timer
        timerIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setRecordingDuration(elapsed);
        }, 1000);

        // Set maximum duration timeout
        maxDurationTimeoutRef.current = setTimeout(() => {
          console.log('[useVoiceRecorder] Maximum recording duration reached, stopping...');
          stopRecording();
        }, MAX_RECORDING_DURATION_MS);

      } catch (permissionError) {
        console.error('[useVoiceRecorder] Permission error:', permissionError);

        // Provide user-friendly error messages
        if (permissionError instanceof Error) {
          if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
            setError('Microphone permission denied. Please allow microphone access in your browser settings.');
          } else if (permissionError.name === 'NotFoundError') {
            setError('No microphone found. Please connect a microphone and try again.');
          } else if (permissionError.name === 'NotReadableError') {
            setError('Microphone is already in use by another application.');
          } else {
            setError('Failed to access microphone. Please try again.');
          }
        } else {
          setError('Failed to access microphone. Please try again.');
        }

        setRecordingState(VoiceRecordingState.ERROR);
        cleanup();
      }
    } catch (error) {
      console.error('[useVoiceRecorder] Start recording error:', error);
      setError('An unexpected error occurred. Please try again.');
      setRecordingState(VoiceRecordingState.ERROR);
      cleanup();
    }
  }, [capabilities, cleanup, convertBlobToBase64]);

  /**
   * Stops voice recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Cancels recording and clears all data
   */
  const cancelRecording = useCallback(() => {
    cleanup();
    setRecordingState(VoiceRecordingState.IDLE);
    setRecordingDuration(0);
    setAudioBlob(null);
    setBase64Audio(null);
    setError(null);
  }, [cleanup]);

  /**
   * Clears error state
   */
  const clearError = useCallback(() => {
    setError(null);
    if (recordingState === VoiceRecordingState.ERROR) {
      setRecordingState(VoiceRecordingState.IDLE);
    }
  }, [recordingState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    // State
    recordingState,
    isRecording: recordingState === VoiceRecordingState.RECORDING,
    recordingDuration,
    error,
    audioBlob,
    base64Audio,
    capabilities,

    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    clearError,
  };
}
