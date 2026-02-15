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
          '/cdn/',
          '/*?*preview_theme*',
          '/*?*fclid*',
          '/*?*gclid*',
          '/*?*fbclid*',
          '/*?*mc_cid*',
        ],
      },
      // Allow Google Merchant Center crawler to access the feed
      {
        userAgent: 'Googlebot',
        allow: ['/api/merchant-feed'],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: '/',
      },
    ],
    sitemap: 'https://crazygels.com/sitemap.xml',
    host: 'https://crazygels.com',
  };
}
