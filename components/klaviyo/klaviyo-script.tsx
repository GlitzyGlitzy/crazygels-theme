'use client';

import { useEffect, useState } from 'react';
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
  const [shouldLoad, setShouldLoad] = useState(false);

  // Always run: suppress unhandled rejections from Klaviyo's third-party
  // script AND determine whether we're on a production domain.
  useEffect(() => {
    // Catch Klaviyo "validation failed" rejections in all environments
    function handleRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      if (
        reason instanceof Error &&
        reason.message === 'validation failed' &&
        reason.stack?.includes('klaviyo')
      ) {
        event.preventDefault();
      }
    }

    window.addEventListener('unhandledrejection', handleRejection);

    // Only load the onsite SDK on the real production domain
    const host = window.location.hostname;
    if (host === 'crazygels.com' || host === 'www.crazygels.com') {
      setShouldLoad(true);
    }

    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  if (!publicKey || !shouldLoad) return null;

  return (
    <Script
      id="klaviyo-sdk"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicKey}`}
      strategy="lazyOnload"
    />
  );
}
