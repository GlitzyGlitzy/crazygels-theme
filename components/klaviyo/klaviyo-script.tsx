'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Loads the Klaviyo JavaScript SDK globally.
 * This enables:
 *  - Client-side event tracking (_learnq.push)
 *  - Hosted signup forms / popups configured in Klaviyo dashboard
 *  - Active on Site tracking for flows
 *
 * Uses Next.js <Script> with lazyOnload strategy so it
 * does not block initial page render or affect Core Web Vitals.
 *
 * Only loads on production to avoid "validation failed" errors
 * from Klaviyo's onsite forms in preview/dev environments.
 */
export function KlaviyoScript() {
  const publicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;

  // Suppress unhandled rejections from Klaviyo's third-party script
  useEffect(() => {
    function handleRejection(event: PromiseRejectionEvent) {
      if (
        event.reason instanceof Error &&
        event.reason.message === 'validation failed' &&
        event.reason.stack?.includes('klaviyo')
      ) {
        event.preventDefault();
      }
    }

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (!publicKey) return null;

  // Skip loading the Klaviyo onsite SDK in non-production environments
  // to prevent "validation failed" errors from their form/popup system.
  const isProduction =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'crazygels.com' ||
      window.location.hostname === 'www.crazygels.com');

  if (!isProduction) return null;

  return (
    <Script
      id="klaviyo-sdk"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicKey}`}
      strategy="lazyOnload"
    />
  );
}
