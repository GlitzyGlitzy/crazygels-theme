/**
 * Judge.me API integration for headless storefront.
 * Docs: https://judge.me/api
 * Base URL: https://judge.me/api/v1
 */

const JUDGEME_BASE = 'https://judge.me/api/v1';
const SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN || '';
const API_TOKEN = process.env.NEXT_PUBLIC_JUDGEME_API_TOKEN || '';

export interface JudgeMeReview {
  id: number;
  title: string;
  body: string;
  rating: number;
  reviewer: {
    name: string;
    email: string;
  };
  created_at: string;
  verified: string; // "buyer" | ""
  product_handle: string;
  pictures?: { urls: { original: string; compact: string } }[];
}

export interface JudgeMeReviewsResponse {
  reviews: JudgeMeReview[];
  current_page: number;
  per_page: number;
}

export interface JudgeMeWidgetData {
  rating: number;
  reviewCount: number;
  badge: string; // HTML badge widget
}

/**
 * Fetch reviews for a specific product by its Shopify internal ID.
 */
export async function getProductReviews(
  productId: string | number,
  page = 1,
  perPage = 5
): Promise<{ reviews: JudgeMeReview[]; rating: number; reviewCount: number }> {
  if (!SHOP_DOMAIN || !API_TOKEN) {
    return { reviews: [], rating: 0, reviewCount: 0 };
  }

  try {
    // Fetch reviews
    const reviewsUrl = new URL(`${JUDGEME_BASE}/reviews`);
    reviewsUrl.searchParams.set('shop_domain', SHOP_DOMAIN);
    reviewsUrl.searchParams.set('api_token', API_TOKEN);
    reviewsUrl.searchParams.set('product_id', String(productId));
    reviewsUrl.searchParams.set('page', String(page));
    reviewsUrl.searchParams.set('per_page', String(perPage));

    const res = await fetch(reviewsUrl.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      console.error('[judgeme] Reviews fetch failed:', res.status);
      return { reviews: [], rating: 0, reviewCount: 0 };
    }

    const data: JudgeMeReviewsResponse = await res.json();

    // Calculate average rating
    const reviews = data.reviews || [];
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const rating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return { reviews, rating, reviewCount: reviews.length };
  } catch (error) {
    console.error('[judgeme] Error fetching reviews:', error);
    return { reviews: [], rating: 0, reviewCount: 0 };
  }
}

/**
 * Fetch the review widget data (star badge) for a product.
 * Uses the widget endpoint which returns pre-rendered HTML.
 */
export async function getProductReviewWidget(
  productId: string | number
): Promise<JudgeMeWidgetData> {
  if (!SHOP_DOMAIN || !API_TOKEN) {
    return { rating: 0, reviewCount: 0, badge: '' };
  }

  try {
    const url = new URL(`${JUDGEME_BASE}/widgets/product_review`);
    url.searchParams.set('shop_domain', SHOP_DOMAIN);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('id', String(productId));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return { rating: 0, reviewCount: 0, badge: '' };
    }

    const data = await res.json();
    return {
      rating: data.rating || 0,
      reviewCount: data.review_count || 0,
      badge: data.badge || '',
    };
  } catch {
    return { rating: 0, reviewCount: 0, badge: '' };
  }
}

/**
 * Extract the numeric Shopify product ID from the GID.
 * e.g. "gid://shopify/Product/1234567890" -> "1234567890"
 */
export function extractShopifyProductId(gid: string): string {
  const match = gid.match(/Product\/(\d+)/);
  return match?.[1] || gid;
}
