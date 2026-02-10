import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
// Crazy Gels Storefront - Production Build
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  async redirects() {
    return [
      // ── Locale prefixes ──────────────────────────────────────
      // Old Shopify locale prefix URLs (e.g. /en, /en/products/...)
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/:path*',
        destination: '/:path*',
        permanent: true,
      },
      // German locale prefix
      {
        source: '/de',
        destination: '/',
        permanent: true,
      },
      {
        source: '/de/:path*',
        destination: '/:path*',
        permanent: true,
      },
      // French locale prefix
      {
        source: '/fr',
        destination: '/',
        permanent: true,
      },
      {
        source: '/fr/:path*',
        destination: '/:path*',
        permanent: true,
      },

      // ── Shopify "all products" collection ────────────────────
      // /collections/all is Shopify's default "show everything" page
      {
        source: '/collections/all',
        destination: '/collections',
        permanent: true,
      },
      // /collections/all with sub-paths (tag filters, etc.)
      {
        source: '/collections/all/:path*',
        destination: '/collections',
        permanent: true,
      },

      // ── Shopify frontpage collection ─────────────────────────
      {
        source: '/collections/frontpage',
        destination: '/',
        permanent: true,
      },

      // ── Old Shopify /all products page ───────────────────────
      {
        source: '/all',
        destination: '/collections',
        permanent: true,
      },

      // ── Old Shopify blog URLs ────────────────────────────────
      {
        source: '/blogs/:blogHandle',
        destination: '/blog',
        permanent: true,
      },
      {
        source: '/blogs/:blogHandle/:articleHandle',
        destination: '/blog/:blogHandle/:articleHandle',
        permanent: true,
      },

      // ── Old Shopify pages ────────────────────────────────────
      {
        source: '/pages/:slug',
        destination: '/',
        permanent: true,
      },

      // ── Shopify account URLs ─────────────────────────────────
      {
        source: '/account',
        destination: '/',
        permanent: false,
      },
      {
        source: '/account/:path*',
        destination: '/',
        permanent: false,
      },

      // ── Shopify search ───────────────────────────────────────
      {
        source: '/search',
        destination: '/collections',
        permanent: false,
      },

      // ── Shopify tool/policy pages ────────────────────────────
      {
        source: '/policies/:slug',
        destination: '/',
        permanent: true,
      },

      // ── Shopify password page ────────────────────────────────
      {
        source: '/password',
        destination: '/',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.shopify.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
