import type { MetadataRoute } from 'next';

const BASE_URL = 'https://crazygels.com';

// Force dynamic so Shopify calls happen at request time, not build time
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages -- always included
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/collections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/consult`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consult/skin`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consult/hair`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Dynamically import Shopify functions to avoid build-time issues
  let productPages: MetadataRoute.Sitemap = [];
  let collectionPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  try {
    const { isShopifyConfigured, getAllProducts, getCollections, getBlogs, getAllBlogArticles } =
      await import('@/lib/shopify');

    if (!isShopifyConfigured) {
      return staticPages;
    }

    // Products
    try {
      const products = await getAllProducts({});
      console.log('[v0] Sitemap: found', (products || []).length, 'products');
      productPages = (products || []).map((product) => ({
        url: `${BASE_URL}/products/${product.handle}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    } catch {
      // Products fetch failed, continue with other entries
    }

    // Collections
    try {
      const collections = await getCollections();
      console.log('[v0] Sitemap: found', (collections || []).length, 'collections');
      collectionPages = (collections || []).map((collection) => ({
        url: `${BASE_URL}/collections/${collection.handle}`,
        lastModified: collection.updatedAt ? new Date(collection.updatedAt) : now,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    } catch {
      // Collections fetch failed, continue with other entries
    }

    // Blog articles
    try {
      const blogs = await getBlogs();
      console.log('[v0] Sitemap: found', (blogs || []).length, 'blogs');
      for (const blog of blogs || []) {
        try {
          const articles = await getAllBlogArticles(blog.handle);
          for (const article of articles || []) {
            blogPages.push({
              url: `${BASE_URL}/blog/${blog.handle}/${article.handle}`,
              lastModified: article.publishedAt ? new Date(article.publishedAt) : now,
              changeFrequency: 'monthly' as const,
              priority: 0.6,
            });
          }
        } catch {
          // Individual blog fetch failed, skip
        }
      }
    } catch {
      // Blogs fetch failed, continue with other entries
    }
  } catch {
    // Shopify module import failed, return static pages only
    return staticPages;
  }

  const allPages = [...staticPages, ...collectionPages, ...productPages, ...blogPages];
  console.log('[v0] Sitemap: total URLs generated:', allPages.length);
  return allPages;
}
