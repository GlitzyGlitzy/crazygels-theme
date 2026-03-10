import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Internal / private
          '/api/',
          '/admin/',
          '/cart',
          '/checkout',
          '/account',

          // Shopify-generated junk URLs that inflate "not indexed" count
          '/collections/*+*',        // tag combos e.g. /collections/all/tag1+tag2
          '/collections/*/tag:*',     // tag filter pages
          '/collections/*/vendor:*',  // vendor filter pages
          '/collections/*?*sort_by*', // sorted collection pages
          '/collections/*?*filter*',  // filtered collection pages
          '/collections/*?*page=*',   // paginated collection pages
          '/products/*?variant=*',    // individual variant URLs
          '/products/*?*utm_*',       // UTM tracking URLs

          // Search with empty or tracking params
          '/search?*',

          // Misc crawl traps
          '/*.json',
          '/*?*preview_theme*',
          '/*?*fclid*',
          '/*?*gclid*',
          '/*?*fbclid*',
          '/*?*mc_cid*',
        ],
      },
      // Googlebot: allow all product and collection pages for Merchant Center
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/products/',
          '/products/*',
          '/collections/',
          '/collections/*',
          '/api/merchant-feed',
        ],
        disallow: [
          '/admin/',
          '/cart',
          '/checkout',
          '/account',
          '/search?*',
          '/*.json',
          '/*?*preview_theme*',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: ['/', '/products/', '/collections/', '/cdn/'],
      },
      // Merchant Center / Shopping feed fetcher
      {
        userAgent: 'Storebot-Google',
        allow: [
          '/',
          '/products/',
          '/products/*',
          '/collections/',
          '/collections/*',
        ],
        disallow: ['/admin/', '/cart', '/checkout', '/account'],
      },
      {
        userAgent: 'Google-InspectionTool',
        allow: [
          '/',
          '/products/',
          '/products/*',
        ],
      },
    ],
    sitemap: 'https://crazygels.com/sitemap.xml',
    host: 'https://crazygels.com',
  };
}
