'use client';

import { useState } from 'react';
import OptimizedImage from './OptimizedImage';

interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  className?: string;
  columns?: number;
  gap?: string;
  showCaptions?: boolean;
  priority?: boolean;
}

/**
 * ImageGallery component with lazy loading, modal viewing, and responsive design
 * Uses OptimizedImage component for best performance
 */
export default function ImageGallery({
  images,
  className = '',
  columns = 3,
  gap = '1rem',
  showCaptions = false,
  priority = false
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  };

  const handleImageError = (index: number) => {
    console.warn(`Failed to load image at index ${index}: ${images[index]?.src}`);
  };

  const openModal = (index: number) => {
    setSelectedImage(index);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedImage(null);
    // Restore body scroll
    document.body.style.overflow = 'unset';
  };

  const goToPrevious = () => {
    if (selectedImage === null) return;
    setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
  };

  const goToNext = () => {
    if (selectedImage === null) return;
    setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (selectedImage === null) return;

    switch (e.key) {
      case 'Escape':
        closeModal();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  };

  // Responsive grid classes
  const getGridClasses = () => {
    switch (columns) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-1 md:grid-cols-2';
      case 3:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  return (
    <>
      <div
        className={`grid ${getGridClasses()} gap-${gap} ${className}`}
        style={{ gap }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-lg"
            onClick={() => openModal(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal(index);
              }
            }}
            aria-label={`View ${image.alt} in full size`}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority && index < 3} // Prioritize first 3 images
              onLoad={() => handleImageLoad(index)}
              onError={() => handleImageError(index)}
            />

            {/* Loading indicator */}
            {!loadedImages.has(index) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Overlay with zoom icon */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>

            {/* Caption */}
            {showCaptions && image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-sm text-center">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal for full-size image viewing */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          {/* Close button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300 transition-colors z-60"
            aria-label="Close gallery"
          >
            ✕
          </button>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300 transition-colors z-60"
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white text-3xl hover:text-gray-300 transition-colors z-60"
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {/* Main image */}
          <div className="max-w-4xl max-h-full p-4">
            <OptimizedImage
              src={images[selectedImage].src}
              alt={images[selectedImage].alt}
              width={images[selectedImage].width}
              height={images[selectedImage].height}
              className="max-w-full max-h-full object-contain"
              priority={true}
            />

            {/* Image info */}
            <div className="mt-4 text-center text-white">
              <p className="text-lg font-medium">{images[selectedImage].alt}</p>
              {images[selectedImage].caption && (
                <p className="text-sm text-gray-300 mt-1">{images[selectedImage].caption}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {selectedImage + 1} of {images.length}
              </p>
            </div>
          </div>

          {/* Thumbnail navigation */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(index);
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === selectedImage
                      ? 'bg-white'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
