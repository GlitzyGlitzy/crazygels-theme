/* cache-bust-v20-feb6 */
import type { Metadata } from 'next'
import { Geist, Geist_Mono, Cormorant_Garamond } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const _cormorant = Cormorant_Garamond({ 
  subsets: ["latin"], 
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif"
});

export const metadata: Metadata = {
  title: 'Crazy Gels | Premium Semi-Cured Gel Nails, Hair & Skin Care',
  description: 'Shop salon-quality semi-cured gel nails, premium hair extensions & skincare products. Easy DIY application, lasts 2+ weeks, zero damage. Free shipping on orders over $50. Trusted by 50K+ customers.',
  keywords: 'semi-cured gel nails, press on nails, gel nail strips, hair extensions, hair care, skincare, beauty products, nail art, French tips, DIY nails, salon nails at home',
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
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'de-DE': '/de-DE',
    },
  },
  openGraph: {
    title: 'Crazy Gels | Premium Semi-Cured Gel Nails, Hair & Skin Care',
    description: 'Shop salon-quality semi-cured gel nails, premium hair extensions & skincare products. Easy DIY application, lasts 2+ weeks, zero damage.',
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
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crazy Gels | Premium Semi-Cured Gel Nails, Hair & Skin Care',
    description: 'Shop salon-quality semi-cured gel nails, premium hair extensions & skincare products. Easy DIY application, lasts 2+ weeks.',
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
    google: 'your-google-verification-code',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  generator: 'v0.app'
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#2C2C2C' },
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
  description: 'Premium semi-cured gel nails, hair extensions & skincare products',
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
    target: 'https://crazygels.com/search?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
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
        {children}
        <Analytics />
      </body>
    </html>
  )
}
