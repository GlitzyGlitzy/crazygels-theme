import type { MetadataRoute } from 'next';
import { getAllProducts, getCollections, getBlogs, getAllBlogArticles, isShopifyConfigured } from '@/lib/shopify';

const BASE_URL = 'https://crazygels.com';

// Revalidate sitemap every 2 hours (products/collections update frequently)
export const revalidate = 7200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ──
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/collections`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/consult`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/consult/skin`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/consult/hair`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    // Legal / info pages
    { url: `${BASE_URL}/pages/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pages/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pages/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/pages/shipping`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/pages/returns`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/pages/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/pages/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    // Recommendations + cart
    { url: `${BASE_URL}/recommendations`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/cart`, lastModified: now, changeFrequency: 'always', priority: 0.3 },
  ];

  if (!isShopifyConfigured) {
    return staticPages;
  }

  let productPages: MetadataRoute.Sitemap = [];
  let collectionPages: MetadataRoute.Sitemap = [];
  let blogPages: MetadataRoute.Sitemap = [];

  // ── Products with images for Google Image Search ──
  try {
    const products = await getAllProducts({});
    productPages = (products || []).map((product) => {
      // Get product images for image sitemap
      const images: { url: string; title?: string }[] = [];
      if (product.featuredImage?.url) {
        images.push({
          url: product.featuredImage.url,
          title: product.featuredImage.altText || product.title,
        });
      }
      // Also include additional images from the product
      const productImages = Array.isArray(product.images)
        ? (product.images as { url: string; altText?: string }[])
        : product.images?.edges?.map((e: { node: { url: string; altText?: string } }) => e.node) || [];
      for (const img of productImages.slice(0, 5)) {
        if (img.url && !images.some(i => i.url === img.url)) {
          images.push({ url: img.url, title: img.altText || product.title });
        }
      }

      return {
        url: `${BASE_URL}/products/${product.handle}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        images: images.map(i => i.url),
      };
    });
  } catch (e) {
    console.error('Sitemap: products fetch failed', e);
  }

  // ── Collections ──
  try {
    const collections = await getCollections();
    collectionPages = (collections || [])
      .filter((c) => c.handle !== 'frontpage') // Skip Shopify default frontpage collection
      .map((collection) => ({
        url: `${BASE_URL}/collections/${collection.handle}`,
        lastModified: collection.updatedAt ? new Date(collection.updatedAt) : now,
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
  } catch (e) {
    console.error('Sitemap: collections fetch failed', e);
  }

  // ── Blog articles ──
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

  return [...staticPages, ...collectionPages, ...productPages, ...blogPages];
}
