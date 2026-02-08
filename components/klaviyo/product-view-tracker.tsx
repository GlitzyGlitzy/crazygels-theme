'use client';

import { useEffect, useRef } from 'react';
import { trackViewedProduct, type KlaviyoProductData } from '@/lib/klaviyo-client';

/**
 * Drop this component onto any product page to fire a "Viewed Product" event
 * to Klaviyo when the page mounts. It only fires once per mount.
 */
export function ProductViewTracker({ product }: { product: KlaviyoProductData }) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;
    trackViewedProduct(product);
  }, [product]);

  return null; // No UI – pure side-effect
}
