/**
 * POST /api/admin/import-amazon-reviews
 *
 * Takes an ASIN + Shopify product handle, scrapes Amazon reviews,
 * and posts them directly to Judge.me via their private API.
 *
 * Body: { asin: string, handle: string, productId: string, marketplace?: string }
 */
import { NextRequest, NextResponse } from 'next/server';

const JUDGEME_BASE = 'https://judge.me/api/v1';
const JUDGEME_SHOP_DOMAIN = process.env.JUDGEME_SHOP_DOMAIN || '';
const JUDGEME_PRIVATE_TOKEN = process.env.JUDGEME_PRIVATE_API_TOKEN || '';
const JUDGEME_PUBLIC_TOKEN = process.env.NEXT_PUBLIC_JUDGEME_API_TOKEN || '';

interface AmazonReview {
  title: string;
  body: string;
  rating: number;
  author: string;
  date: string;
  verified: boolean;
}

// Amazon marketplace domains
const MARKETPLACES: Record<string, string> = {
  de: 'www.amazon.de',
  com: 'www.amazon.com',
  uk: 'www.amazon.co.uk',
  fr: 'www.amazon.fr',
  it: 'www.amazon.it',
  es: 'www.amazon.es',
};

/**
 * Scrape reviews from Amazon product page.
 * Uses the reviews page which is more parseable.
 */
async function scrapeAmazonReviews(
  asin: string,
  marketplace = 'de'
): Promise<AmazonReview[]> {
  const domain = MARKETPLACES[marketplace] || MARKETPLACES.de;
  const reviews: AmazonReview[] = [];

  // Fetch up to 3 pages of reviews (30 reviews)
  for (let page = 1; page <= 3; page++) {
    try {
      const url = `https://${domain}/product-reviews/${asin}/?filterByStar=all_stars&pageNumber=${page}&sortBy=recent`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,de;q=0.8',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      if (!res.ok) {
        console.error(`[amazon-scraper] Page ${page} failed: ${res.status}`);
        break;
      }

      const html = await res.text();

      // Parse individual reviews from the HTML
      const reviewBlocks = html.split('data-hook="review"');

      for (let i = 1; i < reviewBlocks.length; i++) {
        const block = reviewBlocks[i];

        // Extract rating (1-5 stars)
        const ratingMatch = block.match(/(\d)(?:\.|,)0 (?:von|out of|sur) 5/);
        const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
        if (rating < 1 || rating > 5) continue;

        // Extract title
        const titleMatch = block.match(/data-hook="review-title"[^>]*>(?:<[^>]*>)*([^<]+)/);
        const title = titleMatch
          ? titleMatch[1].trim()
          : '';

        // Extract body
        const bodyMatch = block.match(/data-hook="review-body"[^>]*>(?:\s*<[^>]*>)*\s*([^<]+)/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';

        // Extract author name
        const authorMatch = block.match(/class="a-profile-name"[^>]*>([^<]+)/);
        const author = authorMatch ? authorMatch[1].trim() : 'Amazon Customer';

        // Extract date
        const dateMatch = block.match(
          /data-hook="review-date"[^>]*>[^,]*,?\s*(?:Rezensiert in [^,]+,?\s*am\s*)?(\d{1,2}\.?\s*\w+\.?\s*\d{4}|\w+\s+\d{1,2},?\s+\d{4})/
        );
        const dateStr = dateMatch ? dateMatch[1].trim() : '';

        // Check if verified purchase
        const verified = block.includes('Verifizierter Kauf') || block.includes('Verified Purchase');

        if (body && body.length > 5) {
          reviews.push({
            title: title || `${rating} Stars`,
            body,
            rating,
            author,
            date: dateStr,
            verified,
          });
        }
      }

      // If we didn't find reviews on this page, stop
      if (reviewBlocks.length <= 1) break;

      // Small delay between pages
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(`[amazon-scraper] Error on page ${page}:`, error);
      break;
    }
  }

  return reviews;
}

/**
 * Post a single review to Judge.me via their API.
 */
async function postReviewToJudgeMe(
  review: AmazonReview,
  productId: string,
  handle: string
): Promise<boolean> {
  try {
    const res = await fetch(`${JUDGEME_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_domain: JUDGEME_SHOP_DOMAIN,
        platform: 'shopify',
        id: productId, // Shopify numeric product ID
        url: `https://crazygels.com/products/${handle}`,
        title: review.title,
        body: review.body,
        rating: review.rating,
        reviewer_name: review.author,
        reviewer_email: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@imported.judgeme.io`,
        api_token: JUDGEME_PRIVATE_TOKEN,
        source: 'amazon',
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[judgeme-import] Failed to post review: ${res.status} ${errText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[judgeme-import] Error posting review:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asin, handle, productId, marketplace = 'de' } = body;

    if (!asin || !handle || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: asin, handle, productId' },
        { status: 400 }
      );
    }

    if (!JUDGEME_PRIVATE_TOKEN || !JUDGEME_SHOP_DOMAIN) {
      return NextResponse.json(
        { error: 'Judge.me credentials not configured' },
        { status: 500 }
      );
    }

    // Step 1: Scrape Amazon reviews
    const amazonReviews = await scrapeAmazonReviews(asin, marketplace);

    if (amazonReviews.length === 0) {
      return NextResponse.json({
        success: true,
        asin,
        handle,
        scraped: 0,
        imported: 0,
        message:
          'No reviews found on Amazon. Amazon may be blocking the request, or this ASIN has no reviews.',
      });
    }

    // Step 2: Post each review to Judge.me
    let imported = 0;
    const errors: string[] = [];

    for (const review of amazonReviews) {
      const success = await postReviewToJudgeMe(review, productId, handle);
      if (success) {
        imported++;
      } else {
        errors.push(`Failed: "${review.title}" by ${review.author}`);
      }
      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    return NextResponse.json({
      success: true,
      asin,
      handle,
      scraped: amazonReviews.length,
      imported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Scraped ${amazonReviews.length} reviews, imported ${imported} to Judge.me`,
    });
  } catch (error) {
    console.error('[import-reviews] Error:', error);
    return NextResponse.json(
      { error: 'Failed to import reviews' },
      { status: 500 }
    );
  }
}
