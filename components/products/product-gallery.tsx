'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/shopify/types';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductGallery({ product }: { product: Product }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef(0);

  const images = product.images.length > 0 
    ? product.images 
    : product.featuredImage 
      ? [product.featuredImage] 
      : [];

  if (images.length === 0) {
    return (
      <div className="aspect-square rounded-2xl bg-muted flex items-center justify-center">
        <span className="text-muted-foreground">No image available</span>
      </div>
    );
  }

  const currentImage = images[selectedIndex];

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setIsZoomed(false);
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setIsZoomed(false);
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Main Image - fixed aspect ratio prevents CLS */}
      <div 
        className="relative aspect-square overflow-hidden rounded-2xl bg-muted group"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentImage.url}
          alt={currentImage.altText || `${product.title} - ${product.productType || 'Beauty Product'} | Crazy Gels`}
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-transform duration-500',
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          )}
          onClick={() => setIsZoomed(!isZoomed)}
        />

        {/* Zoom Hint */}
        <button
          onClick={() => setIsZoomed(!isZoomed)}
          className="absolute right-4 top-4 rounded-full bg-background/80 p-2 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="Toggle zoom"
        >
          <ZoomIn className="h-5 w-5" />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 md:left-4"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100 md:right-4"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Sale Badge */}
        {product.variants?.edges?.[0]?.node.compareAtPrice && (
          <div className="absolute left-3 top-3 rounded-full bg-[#A15D67] px-3 py-1.5 text-xs font-medium tracking-wide text-white md:left-4 md:top-4">
            SALE
          </div>
        )}

        {/* Mobile dot indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  selectedIndex === index
                    ? 'w-6 bg-white'
                    : 'w-2 bg-white/50'
                )}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Grid - hidden on mobile, show dots instead */}
      {images.length > 1 && (
        <div className="hidden md:flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
              <button
                key={index}
                onClick={() => { setSelectedIndex(index); setIsZoomed(false); }}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  selectedIndex === index
                    ? 'border-[#B76E79] ring-2 ring-[#B76E79]/20'
                    : 'border-transparent hover:border-border'
                )}
                aria-label={`View image ${index + 1}`}
                aria-current={selectedIndex === index ? 'true' : undefined}
              >
                <img
                  src={image.url}
                  alt={image.altText || `${product.title} - ${product.productType || 'Beauty Product'} view ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
          ))}
        </div>
      )}
    </div>
  );
}
