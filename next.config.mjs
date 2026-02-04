/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Enable image optimization for Shopify CDN
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**',
      },
      {
        protocol: 'https',
        hostname: '*.cdn.shopify.com',
        pathname: '/**',
      },
    ],
    // Optimized device sizes for responsive images
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
    // Image sizes for srcSet generation
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Cache optimized images for 1 year
    minimumCacheTTL: 31536000,
    // Quality setting for optimized images
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

export default nextConfig
