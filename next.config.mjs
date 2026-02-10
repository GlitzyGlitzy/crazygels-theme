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
      // Old Shopify URLs indexed by Google
      {
        source: '/all',
        destination: '/collections',
        permanent: true,
      },
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
