'use client';

import Script from 'next/script';

/**
 * Loads the Klaviyo JavaScript SDK globally.
 * This enables:
 *  - Client-side event tracking (_learnq.push)
 *  - Hosted signup forms / popups configured in Klaviyo dashboard
 *  - Active on Site tracking for flows
 *
 * Uses Next.js <Script> with afterInteractive strategy so it
 * does not block initial page render or affect Core Web Vitals.
 */
export function KlaviyoScript() {
  const publicKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;

  if (!publicKey) return null;

  return (
    <Script
      id="klaviyo-sdk"
      src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${publicKey}`}
      strategy="lazyOnload"
    />
  );
}
