/**
 * Judge.me API integration for headless storefront.
 * Docs: https://judge.me/api
 * Base URL: https://judge.me/api/v1
 *
 * Supports:
 * - Fetching reviews by Shopify product ID (external_id)
 * - Fetching reviews by product handle (for Amazon-imported reviews)
 * - Widget endpoint for accurate aggregate rating & count
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
  source?: string; // "amazon", "aliexpress", "web", etc.
}

export interface JudgeMeReviewsResponse {
  reviews: JudgeMeReview[];
  current_page: number;
  per_page: number;
}

// ────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────

function parseReviews(raw: Record<string, unknown>[]): JudgeMeReview[] {
  return raw.map((r) => ({
    id: r.id as number,
    title: (r.title as string) || '',
    body: (r.body as string) || '',
    rating: r.rating as number,
    reviewer: {
      name: ((r.reviewer as Record<string, unknown>)?.name as string) || 'Anonymous',
      email: ((r.reviewer as Record<string, unknown>)?.email as string) || '',
    },
    created_at: r.created_at as string,
    verified:
      (r.verified as string) === 'buyer' ||
      (r.verified as string) === 'yes'
        ? 'buyer'
        : '',
    product_handle: (r.product_handle as string) || '',
    pictures: r.pictures as JudgeMeReview['pictures'],
    source: (r.source as string) || '',
  }));
}

function calcAvgRating(reviews: JudgeMeReview[]): number {
  if (reviews.length === 0) return 0;
  const total = reviews.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

/**
 * Extract the numeric Shopify product ID from the GID.
 * e.g. "gid://shopify/Product/1234567890" -> "1234567890"
 */
export function extractShopifyProductId(gid: string): string {
  const match = gid.match(/Product\/(\d+)/);
  return match?.[1] || gid;
}

// ────────────────────────────────────────────────────
// Core API calls
// ────────────────────────────────────────────────────

/**
 * Fetch reviews for a product. Tries external_id first (Shopify ID),
 * then falls back to handle-based lookup (catches Amazon-imported reviews
 * that were matched by handle/SKU in Judge.me).
 */
export async function getProductReviews(
  productId: string | number,
  handle?: string,
  page = 1,
  perPage = 20
): Promise<{ reviews: JudgeMeReview[]; rating: number; reviewCount: number }> {
  if (!SHOP_DOMAIN || !API_TOKEN) {
    return { reviews: [], rating: 0, reviewCount: 0 };
  }

  try {
    // 1. Try by external_id (Shopify product ID)
    const url = new URL(`${JUDGEME_BASE}/reviews`);
    url.searchParams.set('shop_domain', SHOP_DOMAIN);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('external_id', String(productId));
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    let reviews: JudgeMeReview[] = [];

    if (res.ok) {
      const data = await res.json();
      reviews = parseReviews(data.reviews || []);
    }

    // 2. If no reviews found by ID and we have a handle, try by handle
    if (reviews.length === 0 && handle) {
      const handleReviews = await fetchReviewsByHandle(handle, page, perPage);
      reviews = handleReviews;
    }

    // 3. Get accurate aggregate from widget endpoint
    const widget = await getProductReviewWidget(String(productId));

    return {
      reviews,
      rating: widget.reviewCount > 0 ? widget.rating : calcAvgRating(reviews),
      reviewCount: widget.reviewCount > 0 ? widget.reviewCount : reviews.length,
    };
  } catch (error) {
    console.error('[judgeme] Error fetching reviews:', error);
    return { reviews: [], rating: 0, reviewCount: 0 };
  }
}

/**
 * Fetch reviews by product handle.
 * Judge.me indexes imported reviews (Amazon, AliExpress, Google) by handle.
 */
async function fetchReviewsByHandle(
  handle: string,
  page = 1,
  perPage = 20
): Promise<JudgeMeReview[]> {
  try {
    const url = new URL(`${JUDGEME_BASE}/reviews`);
    url.searchParams.set('shop_domain', SHOP_DOMAIN);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('handle', handle);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    return parseReviews(data.reviews || []);
  } catch {
    return [];
  }
}

/**
 * Fetch the review widget data for a product.
 * The widget endpoint returns the accurate aggregate rating & count
 * across ALL pages of reviews (not just the current page).
 */
export async function getProductReviewWidget(
  productId: string | number
): Promise<{ rating: number; reviewCount: number }> {
  if (!SHOP_DOMAIN || !API_TOKEN) {
    return { rating: 0, reviewCount: 0 };
  }

  try {
    const url = new URL(`${JUDGEME_BASE}/widgets/product_review`);
    url.searchParams.set('shop_domain', SHOP_DOMAIN);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('external_id', String(productId));

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return { rating: 0, reviewCount: 0 };

    // Widget returns JSON with an HTML string -- parse aggregate data from it
    const data = await res.json();

    // Try structured fields first
    if (data.rating && data.review_count) {
      return {
        rating: parseFloat(data.rating) || 0,
        reviewCount: parseInt(data.review_count, 10) || 0,
      };
    }

    // Fallback: parse from the widget HTML
    const html = typeof data.widget === 'string' ? data.widget : JSON.stringify(data);
    const ratingMatch = html.match(/data-average-rating="([^"]+)"/);
    const countMatch = html.match(/data-number-of-reviews="([^"]+)"/);

    return {
      rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
      reviewCount: countMatch ? parseInt(countMatch[1], 10) : 0,
    };
  } catch {
    return { rating: 0, reviewCount: 0 };
  }
}
