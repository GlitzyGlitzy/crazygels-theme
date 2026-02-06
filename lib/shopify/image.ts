/**
 * Shopify Image Optimization Utilities
 * 
 * These utilities help resize and optimize Shopify CDN images
 * for better performance and visual quality across all devices.
 */

export type ImageSize = 'thumbnail' | 'small' | 'medium' | 'large' | 'xlarge' | 'original';

// Predefined sizes for different use cases
export const IMAGE_SIZES = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1000, height: 1000 },
  xlarge: { width: 1600, height: 1600 },
  original: { width: 0, height: 0 }, // No resizing
} as const;

// Responsive breakpoints for srcSet generation
export const BREAKPOINTS = [320, 640, 768, 1024, 1280, 1536, 1920] as const;

/**
 * Transforms a Shopify CDN image URL to include size parameters
 * Shopify's CDN automatically handles resizing and optimization
 * 
 * @param url - Original Shopify image URL
 * @param options - Resize options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'center' | 'top' | 'bottom' | 'left' | 'right';
    scale?: 1 | 2 | 3;
    format?: 'jpg' | 'png' | 'webp' | 'avif';
  } = {}
): string {
  if (!url) return '';
  
  // Check if it's a Shopify CDN URL
  if (!url.includes('cdn.shopify.com')) {
    return url;
  }

  const { width, height, crop = 'center', scale = 1, format } = options;
  
  // Use Shopify's Image Transform API via query parameters.
  // The old _WxH_crop_X suffix format only works for /products/ paths,
  // NOT for /files/ paths on the newer CDN. Query params work for both.
  const params = new URLSearchParams();
  if (width) params.set('width', String(width));
  if (height) params.set('height', String(height));
  if (crop) params.set('crop', crop);
  if (scale && scale > 1) params.set('scale', String(scale));
  if (format) params.set('format', format);

  // If no transform params needed, return original URL
  if (params.toString() === '') return url;

  // Strip existing query string and rebuild
  const [baseUrl] = url.split('?');
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Get a preset size image URL
 */
export function getImageBySize(url: string, size: ImageSize): string {
  if (size === 'original') return url;
  
  const dimensions = IMAGE_SIZES[size];
  return getOptimizedImageUrl(url, {
    width: dimensions.width,
    height: dimensions.height,
    crop: 'center',
  });
}

/**
 * Generate srcSet for responsive images
 * This creates multiple image URLs for different screen sizes
 */
export function generateSrcSet(
  url: string,
  options: {
    maxWidth?: number;
    aspectRatio?: number; // e.g., 1 for square, 0.75 for 4:3
  } = {}
): string {
  if (!url || !url.includes('cdn.shopify.com')) {
    return url;
  }

  const { maxWidth = 1920, aspectRatio } = options;
  
  const relevantBreakpoints = BREAKPOINTS.filter(bp => bp <= maxWidth);
  
  const srcSetParts = relevantBreakpoints.map(width => {
    const height = aspectRatio ? Math.round(width * aspectRatio) : undefined;
    const optimizedUrl = getOptimizedImageUrl(url, { width, height });
    return `${optimizedUrl} ${width}w`;
  });
  
  return srcSetParts.join(', ');
}

/**
 * Get optimal sizes attribute for responsive images
 */
export function getImageSizes(layout: 'full' | 'half' | 'third' | 'quarter' | 'grid'): string {
  switch (layout) {
    case 'full':
      return '100vw';
    case 'half':
      return '(min-width: 768px) 50vw, 100vw';
    case 'third':
      return '(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';
    case 'quarter':
      return '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw';
    case 'grid':
      return '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw';
    default:
      return '100vw';
  }
}

/**
 * Calculate placeholder blur data URL dimensions
 * Returns small dimensions for efficient blur placeholder generation
 */
export function getBlurPlaceholderUrl(url: string): string {
  return getOptimizedImageUrl(url, { width: 10, height: 10 });
}

/**
 * Check if an image URL is valid and from Shopify CDN
 */
export function isValidShopifyImage(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('cdn.shopify.com') && /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(url);
}

/**
 * Get image dimensions from Shopify URL if available
 * Returns null if dimensions cannot be determined
 */
export function getImageDimensions(url: string): { width: number; height: number } | null {
  if (!url) return null;
  
  // Try to extract dimensions from URL pattern like _800x600
  const match = url.match(/_(\d+)x(\d+)/);
  if (match) {
    return {
      width: parseInt(match[1], 10),
      height: parseInt(match[2], 10),
    };
  }
  
  return null;
}

/**
 * Convert image to WebP format for better compression
 * Shopify CDN supports automatic format conversion
 */
export function getWebPUrl(url: string): string {
  if (!url || !url.includes('cdn.shopify.com')) return url;
  return getOptimizedImageUrl(url, { format: 'webp' });
}

/**
 * Image loader function for Next.js Image component
 * Can be used with the `loader` prop
 */
export function shopifyImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // If not a Shopify URL, return as-is
  if (!src.includes('cdn.shopify.com')) {
    return src;
  }

  // Shopify doesn't support quality parameter directly,
  // but we can use width for responsive images
  return getOptimizedImageUrl(src, { width });
}
