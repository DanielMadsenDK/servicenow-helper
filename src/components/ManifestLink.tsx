'use client';

import { useEffect } from 'react';
import { isIOSDevice } from '@/lib/platform-detection';

/**
 * ManifestLink Component
 *
 * Dynamically injects the correct PWA manifest link based on platform detection.
 *
 * CRITICAL: iOS requires browser display mode for getUserMedia/MediaRecorder APIs.
 * This component ensures iOS devices use manifest-ios.json which has display: "browser"
 * instead of display: "standalone" used by Android/Desktop.
 *
 * The manifest link is updated client-side after initial page load to avoid hydration mismatches.
 */
export default function ManifestLink() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Detect if iOS device
    const iOS = isIOSDevice();

    // Determine which manifest to use
    const manifestPath = iOS ? '/manifest-ios.json' : '/manifest.json';

    // Find existing manifest link
    let manifestLink = document.querySelector('link[rel="manifest"]');

    if (manifestLink) {
      // Update existing manifest link
      manifestLink.setAttribute('href', manifestPath);
    } else {
      // Create new manifest link if it doesn't exist
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      manifestLink.setAttribute('href', manifestPath);
      document.head.appendChild(manifestLink);
    }

    // Log for debugging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[ManifestLink] Platform:', iOS ? 'iOS' : 'Other', '| Manifest:', manifestPath);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
