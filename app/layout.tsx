/* cache-bust-v20-feb6 */
import type { Metadata } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { KlaviyoScript } from '@/components/klaviyo/klaviyo-script'
import { GtmNoscript } from '@/components/gtm-noscript'
import './globals.css'

const GTM_ID = 'GTM-W7NQG2QL'
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''

const _geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const _cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif"
});

export const metadata: Metadata = {
  title: 'Crazy Gels | Biohacking Beauty — AI-Powered Skin, Hair & Nail Optimization',
  description: 'The first biohacking platform that treats skin, hair, and nails as one interconnected system. AI-powered bio-analysis, precision formulations, and biological optimization. Start your free scan today.',
  keywords: 'biohacking beauty, AI skin analysis, hair analysis, nail health, biological optimization, personalized skincare, bio-score, precision formulations, collagen, keratin',
  authors: [{ name: 'Crazy Gels' }],
  creator: 'Crazy Gels',
  publisher: 'Crazy Gels',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://crazygels.com'),
  alternates: {
    canonical: 'https://crazygels.com',
    languages: {
      'de-DE': 'https://crazygels.com',
      'en': 'https://crazygels.com',
      'x-default': 'https://crazygels.com',
    },
  },
  openGraph: {
    title: 'Crazy Gels | Biohacking Beauty — AI-Powered Skin, Hair & Nail Optimization',
    description: 'The first biohacking platform that treats skin, hair, and nails as one interconnected system. AI-powered bio-analysis and precision formulations.',
    url: 'https://crazygels.com',
    siteName: 'Crazy Gels',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Crazy Gels - Premium Beauty Products',
      },
    ],
    locale: 'de_DE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crazy Gels | Biohacking Beauty — AI-Powered Optimization',
    description: 'The first biohacking platform treating skin, hair, and nails as one interconnected system. Start your free bio-analysis.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.jpg',
  },
  generator: 'v0.app'
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0A0A0A' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Crazy Gels',
  url: 'https://crazygels.com',
  logo: 'https://crazygels.com/logo.png',
  description: 'Biohacking beauty platform — AI-powered skin, hair & nail biological optimization',
  sameAs: [
    'https://www.instagram.com/crazy.gels',
    'https://www.facebook.com/crazygels',
    'https://www.tiktok.com/@cazygels',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'info@crazygels.com',
    contactType: 'customer service',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Crazy Gels',
  url: 'https://crazygels.com',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://crazygels.com/collections?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className={`${_geist.variable} ${_geistMono.variable} ${_cormorant.variable} font-sans antialiased`} suppressHydrationWarning>
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`,
          }}
        />
        {/* Direct GA4 measurement -- ensures data flows even if GTM tags are misconfigured */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              id="ga4-gtag"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script
              id="ga4-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
gtag('js',new Date());
gtag('config','${GA_MEASUREMENT_ID}',{
  page_path:window.location.pathname,
  cookie_domain:'crazygels.com',
  cookie_flags:'SameSite=None;Secure',
  send_page_view:true
});`,
              }}
            />
          </>
        )}
        <GtmNoscript gtmId={GTM_ID} />
        {children}
        <Analytics />
        <KlaviyoScript />
      </body>
    </html>
  )
}
