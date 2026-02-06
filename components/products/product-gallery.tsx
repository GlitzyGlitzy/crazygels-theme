'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/shopify/types';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductGallery({ product }: { product: Product }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

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

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted group">
        <Image
          src={currentImage.url}
          alt={currentImage.altText || product.title}
          fill
          className={cn(
            'object-cover transition-transform duration-500',
            isZoomed && 'scale-150 cursor-zoom-out'
          )}
          onClick={() => setIsZoomed(!isZoomed)}
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
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
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              onClick={goToPrevious}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              onClick={goToNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Sale Badge */}
        {product.variants.edges[0]?.node.compareAtPrice && (
          <div className="absolute left-4 top-4 rounded-full bg-[#B8860B] px-3 py-1.5 text-xs font-medium tracking-wide text-white">
            SALE
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                  selectedIndex === index
                    ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20'
                    : 'border-transparent hover:border-border'
                )}
                aria-label={`View image ${index + 1}`}
                aria-current={selectedIndex === index ? 'true' : undefined}
              >
                <Image
                  src={image.url}
                  alt={image.altText || `${product.title} - Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
          ))}
        </div>
      )}

      {/* Image Counter */}
      {images.length > 1 && (
        <p className="text-center text-sm text-muted-foreground">
          {selectedIndex + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
