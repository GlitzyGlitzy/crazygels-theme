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
      // Old Shopify /all products page
      {
        source: '/all',
        destination: '/',
        permanent: true,
      },
      // Old Shopify blog URLs
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
      // Old Shopify pages
      {
        source: '/pages/:slug',
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
