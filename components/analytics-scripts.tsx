'use client'

import Script from 'next/script'

/**
 * Client component wrapper for all analytics scripts (GTM + GA4).
 *
 * Extracted from layout.tsx to prevent Turbopack ChunkLoadError --
 * next/script is a client component and using it directly inside
 * a Server Component layout can cause chunk-splitting failures
 * with Turbopack in Next.js 16.
 */
export function AnalyticsScripts({
  gtmId,
  gaMeasurementId,
}: {
  gtmId: string
  gaMeasurementId: string
}) {
  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`,
        }}
      />
      {/* Direct GA4 measurement -- ensures data flows even if GTM tags are misconfigured */}
      {gaMeasurementId && (
        <>
          <Script
            id="ga4-gtag"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${gaMeasurementId}',{
  page_path:window.location.pathname,
  cookie_domain:'crazygels.com',
  cookie_flags:'SameSite=None;Secure',
  send_page_view:true
});`,
            }}
          />
        </>
      )}
    </>
  )
}
