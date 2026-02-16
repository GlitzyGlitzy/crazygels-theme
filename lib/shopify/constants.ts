// Use stable API version (2024-01 is widely supported)
export const SHOPIFY_GRAPHQL_API_ENDPOINT = '/api/2024-01/graphql.json';

export const DEFAULT_OPTION = 'Default Title';

export const HIDDEN_PRODUCT_TAG = 'nextjs-frontend-hidden';

export const TAGS = {
  collections: 'collections',
  products: 'products',
  cart: 'cart',
  blog: 'blog'
};

export const COLLECTION_SORT_KEYS = {
  RELEVANCE: 'RELEVANCE',
  BEST_SELLING: 'BEST_SELLING',
  CREATED_AT: 'CREATED_AT',
  PRICE: 'PRICE',
  TITLE: 'TITLE'
} as const;

export const PRODUCT_SORT_KEYS = {
  RELEVANCE: 'RELEVANCE',
  BEST_SELLING: 'BEST_SELLING',
  CREATED_AT: 'CREATED_AT',
  PRICE: 'PRICE',
  TITLE: 'TITLE'
} as const;

// Rate limiting configuration
export const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 20, // Shopify Storefront API allows ~100/sec; 20 is safe
  RETRY_DELAY_MS: 1000,
  MAX_RETRIES: 3,
};

// Cache revalidation times (in seconds)
export const CACHE_TIMES = {
  products: 300, // 5 minutes for products (was 60s, reduces Shopify round-trips)
  collections: 600, // 10 minutes for collections
  cart: 0, // No cache for cart (always fresh)
};
