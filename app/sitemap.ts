import type { MetadataRoute } from 'next';
import { getAllProducts, getCollections, getBlogs, getAllBlogArticles, isShopifyConfigured } from '@/lib/shopify';

const BASE_URL = 'https://crazygels.com';

// Revalidate sitemap every hour at request time
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/collections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/consult`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/consult/skin`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consult/hair`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Note: /search is not listed here because it redirects to /collections
  ];

  // Subcategory landing pages matching top Google Merchant Center search topics.
  // These filtered views help Google discover and index our best-performing categories.
  const subcategoryPages: MetadataRoute.Sitemap = [
    // Skincare subcategories (85 searches, trending +1.1%)
    { url: `${BASE_URL}/collections/skincare?subcategory=face-cream`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/skincare?subcategory=toners`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/skincare?subcategory=serums`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/skincare?subcategory=face-masks`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/skincare?subcategory=wash-gels`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/collections/skincare?subcategory=body-care`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Haircare subcategories (Shampoo & Conditioner: 19 searches, trending +3.7%)
    { url: `${BASE_URL}/collections/haircare?subcategory=shampoo`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/haircare?subcategory=conditioner`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/collections/haircare?subcategory=hair-masks`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/collections/haircare?subcategory=oils-serums`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // Nails subcategories (Nail Polish: 9 searches, Artificial Nails: 3 searches)
    { url: `${BASE_URL}/collections/gel-nail-wraps?subcategory=french-tips`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/collections/gel-nail-wraps?subcategory=solid-colors`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
  ];

  if (!isShopifyConfigured) {
    return staticPages;
  }

  let productPages: MetadataRoute.Sitemap = [];
  let collectionPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  // Products
  try {
    const products = await getAllProducts({});
    productPages = (products || []).map((product) => ({
      url: `${BASE_URL}/products/${product.handle}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error('Sitemap: products fetch failed', e);
  }

  // Collections
  try {
    const collections = await getCollections();
    collectionPages = (collections || []).map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      lastModified: collection.updatedAt ? new Date(collection.updatedAt) : now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (e) {
    console.error('Sitemap: collections fetch failed', e);
  }

  // Blog articles
  try {
    const blogs = await getBlogs();
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
  } catch (e) {
    console.error('Sitemap: blogs fetch failed', e);
  }

  return [...staticPages, ...subcategoryPages, ...collectionPages, ...productPages, ...blogPages];
}
