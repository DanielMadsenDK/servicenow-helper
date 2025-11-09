import type { PlatformCapabilities, AudioFormat } from '@/types';

/**
 * Detects the platform (iOS, Android, Desktop) and its capabilities for voice recording
 *
 * CRITICAL iOS LIMITATION:
 * getUserMedia does NOT work in iOS PWAs running in standalone mode due to Apple security restrictions.
 * It only works when the PWA is running in Safari browser mode.
 *
 * @returns PlatformCapabilities object with platform information and capabilities
 */
export function detectPlatformCapabilities(): PlatformCapabilities {
  // Default capabilities (server-side rendering safe)
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isStandalone: false,
      supportsMediaRecorder: false,
      supportsGetUserMedia: false,
      preferredAudioFormat: 'webm',
      canUseVoiceInput: false,
      warning: 'Platform detection not available on server'
    };
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

  // Detect Android
  const isAndroid = /android/i.test(userAgent);

  // Detect if running in standalone mode (PWA installed to home screen)
  const isStandalone =
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true || // iOS specific
    document.referrer.includes('android-app://'); // Android specific

  // Check MediaRecorder API support
  const supportsMediaRecorder = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported !== undefined;

  // Check getUserMedia support
  const supportsGetUserMedia = !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );

  // Determine preferred audio format
  // iOS doesn't support webm, so we need to use mp4
  const preferredAudioFormat: AudioFormat = isIOS ? 'mp4' : 'webm';

  // Check specific format support
  let formatSupported = false;
  if (supportsMediaRecorder) {
    if (isIOS) {
      // Check for mp4/aac support on iOS
      formatSupported =
        MediaRecorder.isTypeSupported('audio/mp4') ||
        MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2') ||
        MediaRecorder.isTypeSupported('audio/aac');
    } else {
      // Check for webm/opus support on other platforms
      formatSupported =
        MediaRecorder.isTypeSupported('audio/webm') ||
        MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
    }
  }

  // CRITICAL: iOS PWA standalone mode limitation
  let canUseVoiceInput = supportsMediaRecorder && supportsGetUserMedia && formatSupported;
  let warning: string | undefined;

  if (isIOS && isStandalone) {
    // iOS PWA in standalone mode cannot access getUserMedia
    canUseVoiceInput = false;
    warning = 'Voice recording is not available in iOS standalone mode. Please use Safari browser to access voice features.';
  } else if (isIOS && !formatSupported) {
    canUseVoiceInput = false;
    warning = 'Voice recording requires enabling MediaRecorder in Settings > Safari > Advanced > Experimental Features > MediaRecorder';
  } else if (!supportsGetUserMedia) {
    warning = 'Your browser does not support microphone access (getUserMedia)';
  } else if (!supportsMediaRecorder) {
    warning = 'Your browser does not support audio recording (MediaRecorder)';
  } else if (!formatSupported) {
    warning = `Your browser does not support the required audio format (${preferredAudioFormat})`;
  }

  return {
    isIOS,
    isAndroid,
    isStandalone,
    supportsMediaRecorder,
    supportsGetUserMedia,
    preferredAudioFormat,
    canUseVoiceInput,
    warning
  };
}

/**
 * Gets the MIME type for MediaRecorder based on platform
 * Returns the most supported format for the current platform
 *
 * @param capabilities Platform capabilities from detectPlatformCapabilities
 * @returns MIME type string for MediaRecorder options
 */
export function getMediaRecorderMimeType(capabilities: PlatformCapabilities): string {
  if (capabilities.isIOS) {
    // Try mp4/aac formats in order of preference
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (MediaRecorder.isTypeSupported('audio/mp4;codecs=mp4a.40.2')) {
        return 'audio/mp4;codecs=mp4a.40.2';
      }
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        return 'audio/mp4';
      }
      if (MediaRecorder.isTypeSupported('audio/aac')) {
        return 'audio/aac';
      }
    }
    return 'audio/mp4'; // Fallback for iOS
  }

  // For Android/Desktop, prefer webm with opus codec
  if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus';
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      return 'audio/webm';
    }
  }

  return 'audio/webm'; // Fallback for other platforms
}

/**
 * Checks if the browser is running in standalone PWA mode
 * @returns true if running as installed PWA
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Checks if the current platform is iOS
 * @returns true if running on iOS device
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
}

/**
 * Checks if the current platform is Android
 * @returns true if running on Android device
 */
export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android/i.test(userAgent);
}
