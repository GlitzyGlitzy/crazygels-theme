"use client";

import { useEffect, useState } from "react";

/**
 * Renders the GTM noscript iframe only after hydration to prevent
 * insertBefore hydration mismatch errors.
 */
export function GtmNoscript({ gtmId }: { gtmId: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
