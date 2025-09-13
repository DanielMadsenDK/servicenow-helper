'use client';

import { useState } from 'react';
import OptimizedImage from './OptimizedImage';
import ImageGallery from './ImageGallery';

/**
 * Example component demonstrating the usage of OptimizedImage and ImageGallery
 * This serves as a reference for developers on how to use the image optimization components
 */
export default function ImageExample() {
  const [showGallery, setShowGallery] = useState(false);

  // Example images for the gallery
  const galleryImages = [
    {
      src: '/favicon-32x32.png',
      alt: 'Favicon 32x32',
      width: 32,
      height: 32,
      caption: 'Small favicon for browser tabs'
    },
    {
      src: '/apple-touch-icon.png',
      alt: 'Apple Touch Icon',
      width: 180,
      height: 180,
      caption: 'iOS home screen icon'
    },
    {
      src: '/maskable_icon_x192.png',
      alt: 'Maskable Icon 192x192',
      width: 192,
      height: 192,
      caption: 'PWA maskable icon'
    },
    {
      src: '/maskable_icon_x512.png',
      alt: 'Maskable Icon 512x512',
      width: 512,
      height: 512,
      caption: 'PWA splash screen icon'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Image Optimization Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Demonstrating Next.js Image component best practices with lazy loading and optimization
        </p>
      </div>

      {/* Single Optimized Image Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Single Image Examples
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Priority Image (Above the fold) */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Priority Image (Above the fold)
            </h3>
            <OptimizedImage
              src="/favicon-32x32.png"
              alt="Priority favicon - loads immediately"
              width={32}
              height={32}
              priority={true}
              className="border border-gray-200 dark:border-gray-700 rounded"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uses <code>priority=true</code> for above-the-fold images
            </p>
          </div>

          {/* Lazy Loaded Image */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Lazy Loaded Image
            </h3>
            <OptimizedImage
              src="/apple-touch-icon.png"
              alt="Lazy loaded apple touch icon"
              width={180}
              height={180}
              className="border border-gray-200 dark:border-gray-700 rounded"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically lazy loads when entering viewport
            </p>
          </div>

          {/* Responsive Image */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Responsive Image
            </h3>
            <OptimizedImage
              src="/maskable_icon_x192.png"
              alt="Responsive maskable icon"
              width={192}
              height={192}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="border border-gray-200 dark:border-gray-700 rounded w-full"
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Uses responsive <code>sizes</code> for optimal loading
            </p>
          </div>
        </div>
      </section>

      {/* Image Gallery Example */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Image Gallery Example
          </h2>
          <button
            onClick={() => setShowGallery(!showGallery)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {showGallery ? 'Hide Gallery' : 'Show Gallery'}
          </button>
        </div>

        {showGallery && (
          <div className="space-y-4">
            <ImageGallery
              images={galleryImages}
              columns={4}
              showCaptions={true}
              className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg"
            />

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
                Gallery Features:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Lazy loading for all images</li>
                <li>• Modal viewer with keyboard navigation</li>
                <li>• Responsive grid layout</li>
                <li>• Loading states and error handling</li>
                <li>• Thumbnail navigation</li>
                <li>• Accessibility features (ARIA labels, keyboard support)</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Usage Instructions */}
      <section className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Usage Instructions
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              1. Import Components
            </h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`import OptimizedImage from '@/components/OptimizedImage';
import ImageGallery from '@/components/ImageGallery';`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              2. Use OptimizedImage
            </h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`<OptimizedImage
  src="/path/to/image.jpg"
  alt="Descriptive alt text"
  width={800}
  height={600}
  priority={true} // For above-the-fold images
  sizes="(max-width: 768px) 100vw, 50vw" // Responsive sizes
  className="rounded-lg shadow-lg"
/>`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              3. Use ImageGallery
            </h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`const images = [
  {
    src: '/image1.jpg',
    alt: 'Image 1',
    width: 800,
    height: 600,
    caption: 'Optional caption'
  }
];

<ImageGallery
  images={images}
  columns={3}
  showCaptions={true}
  priority={false}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              4. Use Lazy Loading Hook
            </h3>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
{`import { useLazyImage } from '@/hooks/useLazyImage';

function MyComponent() {
  const { ref, isIntersecting, hasLoaded } = useLazyImage();

  return (
    <div ref={ref}>
      {isIntersecting && (
        <OptimizedImage src="/image.jpg" alt="Lazy loaded" />
      )}
    </div>
  );
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Performance Benefits */}
      <section className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold text-green-900 dark:text-green-100 mb-4">
          Performance Benefits
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              🚀 Loading Performance
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Automatic WebP/AVIF conversion</li>
              <li>• Lazy loading reduces initial bundle size</li>
              <li>• Responsive images load optimal sizes</li>
              <li>• Blur placeholders improve perceived performance</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              📊 Core Web Vitals
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• Improved Largest Contentful Paint (LCP)</li>
              <li>• Better Cumulative Layout Shift (CLS)</li>
              <li>• Enhanced First Contentful Paint (FCP)</li>
              <li>• Reduced bandwidth usage</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
