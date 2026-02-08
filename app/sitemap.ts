import type { MetadataRoute } from 'next';
import { getCollections, getAllProducts, getBlogs, getAllBlogArticles, isShopifyConfigured } from '@/lib/shopify';

const BASE_URL = 'https://crazygels.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/consult`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/consult/skin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/consult/hair`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.3,
    },
  ];

  if (!isShopifyConfigured()) {
    return staticPages;
  }

  // Dynamic: all products
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts({});
    productPages = products.map((product) => ({
      url: `${BASE_URL}/products/${product.handle}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error('Sitemap: failed to fetch products', e);
  }

  // Dynamic: all collections
  let collectionPages: MetadataRoute.Sitemap = [];
  try {
    const collections = await getCollections();
    collectionPages = collections.map((collection) => ({
      url: `${BASE_URL}/collections/${collection.handle}`,
      lastModified: collection.updatedAt ? new Date(collection.updatedAt) : new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));
  } catch (e) {
    console.error('Sitemap: failed to fetch collections', e);
  }

  // Dynamic: all blog articles
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const blogs = await getBlogs();
    for (const blog of blogs) {
      const articles = await getAllBlogArticles(blog.handle);
      const articlePages = articles.map((article) => ({
        url: `${BASE_URL}/blog/${blog.handle}/${article.handle}`,
        lastModified: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
      blogPages.push(...articlePages);
    }
  } catch (e) {
    console.error('Sitemap: failed to fetch blog articles', e);
  }

  return [...staticPages, ...collectionPages, ...productPages, ...blogPages];
}
