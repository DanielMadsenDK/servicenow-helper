import { useState, useRef, useEffect } from 'react';

interface UseLazyImageOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseLazyImageReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isIntersecting: boolean;
  hasLoaded: boolean;
  handleLoad: () => void;
  handleError: () => void;
}

/**
 * Custom hook for lazy loading images using Intersection Observer
 * Provides automatic loading when image enters viewport
 */
export function useLazyImage(options: UseLazyImageOptions = {}): UseLazyImageReturn {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If already loaded or errored, don't set up observer
    if (hasLoaded || hasError) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);

          // Disconnect observer if we only want to trigger once
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          // Allow re-triggering if not triggerOnce
          setIsIntersecting(false);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasLoaded, hasError]);

  const handleLoad = () => {
    setHasLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  return {
    ref,
    isIntersecting,
    hasLoaded,
    handleLoad,
    handleError
  };
}

/**
 * Hook for preloading critical images
 * Useful for above-the-fold images that should load immediately
 */
export function useImagePreloader(src: string): boolean {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(false);

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return isLoaded;
}

/**
 * Hook for managing multiple image loading states
 * Useful for image galleries or multiple images
 */
export function useMultipleImages(srcs: string[]): {
  loadedCount: number;
  totalCount: number;
  isAllLoaded: boolean;
  loadedImages: Set<string>;
} {
  const [loadedImages, setLoadedImages] = useState(new Set<string>());

  useEffect(() => {
    const validSrcs = srcs.filter(Boolean);

    validSrcs.forEach(src => {
      if (loadedImages.has(src)) return;

      const img = new Image();
      img.src = src;
      img.onload = () => {
        setLoadedImages(prev => new Set([...prev, src]));
      };
    });
  }, [srcs, loadedImages]);

  const loadedCount = loadedImages.size;
  const totalCount = srcs.filter(Boolean).length;
  const isAllLoaded = loadedCount === totalCount;

  return {
    loadedCount,
    totalCount,
    isAllLoaded,
    loadedImages
  };
}
