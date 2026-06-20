'use client';

type GrowthEventProperties = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (command: 'event', eventName: string, properties?: GrowthEventProperties) => void;
  }
}

export function trackGrowthEvent(eventName: string, properties: GrowthEventProperties = {}) {
  if (typeof window === 'undefined') return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...properties,
  });

  window.gtag?.('event', eventName, properties);
}
