'use client';

import Image, { ImageProps } from 'next/image';
import { getOptimizedImageUrl } from '@/lib/shopify/image';

/**
 * Safe image wrapper that:
 * 1. Uses next/image for layout (fill, aspect ratio, lazy loading)
 * 2. Delegates optimization to Shopify CDN instead of Next.js proxy
 * 3. Falls back gracefully if an image fails to load
 */
export function OptimizedImage({
  src,
  alt,
  width: targetWidth,
  shopifyWidth,
  fallback = '/images/placeholder.svg',
  ...props
}: Omit<ImageProps, 'onError'> & {
  shopifyWidth?: number;
  fallback?: string;
}) {
  // Optimize Shopify CDN URLs at the URL level
  const optimizedSrc = typeof src === 'string' && src.includes('cdn.shopify.com') && shopifyWidth
    ? getOptimizedImageUrl(src, { width: shopifyWidth, format: 'webp' })
    : src;

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={targetWidth}
      onError={(e) => {
        // Failsafe: swap to fallback if image breaks
        const target = e.currentTarget;
        if (target.src !== fallback) {
          target.src = fallback;
        }
      }}
      {...props}
    />
  );
}
