import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { TAGS } from '@/lib/shopify/constants';

/**
 * Revalidation Endpoint -- Instant Shopify Updates
 * 
 * Two ways to trigger instant cache purges:
 * 
 * 1. MANUAL (no setup needed):
 *    curl -X POST https://crazygels.com/api/revalidate?tag=products
 *    curl -X POST https://crazygels.com/api/revalidate?tag=collections
 *    curl -X POST https://crazygels.com/api/revalidate  (purges everything)
 *
 * 2. SHOPIFY WEBHOOKS (optional, for fully automatic):
 *    Shopify Admin > Settings > Notifications > Webhooks
 *    URL: https://crazygels.com/api/revalidate
 *    Events: Product update/create/delete, Collection update/create/delete
 *    If you set this up, also add SHOPIFY_REVALIDATION_SECRET env var
 *    to match the webhook signing secret shown in Shopify Admin.
 *
 * Without the secret, the endpoint works but without HMAC verification.
 */

export async function POST(req: NextRequest) {
  try {
    // ── Option A: Manual revalidation via ?tag= query param ──
    const tagParam = req.nextUrl.searchParams.get('tag');
    if (tagParam) {
      const validTags = [TAGS.products, TAGS.collections, TAGS.cart, TAGS.blog];
      const tagsToRevalidate = tagParam === 'all' ? [TAGS.products, TAGS.collections] : [tagParam];
      
      const revalidated: string[] = [];
      for (const tag of tagsToRevalidate) {
        if (validTags.includes(tag)) {
          revalidateTag(tag, 'max');
          revalidated.push(tag);
        }
      }

      console.log(`[Revalidate] Manual purge: ${revalidated.join(', ')}`);
      return NextResponse.json({ revalidated: true, tags: revalidated, now: Date.now() });
    }

    // ── Option B: Shopify webhook with optional HMAC verification ──
    const secret = process.env.SHOPIFY_REVALIDATION_SECRET;
    const body = await req.text();

    // Verify HMAC only if secret is configured
    if (secret) {
      const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
      if (!hmacHeader) {
        return NextResponse.json({ message: 'Missing HMAC header' }, { status: 401 });
      }

      const crypto = await import('crypto');
      const generatedHmac = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      if (generatedHmac !== hmacHeader) {
        return NextResponse.json({ message: 'Invalid HMAC' }, { status: 401 });
      }
    }

    // Determine what Shopify topic triggered this
    const topic = req.headers.get('x-shopify-topic') || '';
    
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(body);
    } catch {
      // Body might be empty for delete events
    }

    const revalidated: string[] = [];

    if (topic.startsWith('products/')) {
      // Product created, updated, or deleted
      revalidateTag(TAGS.products, 'max');
      revalidated.push(TAGS.products);

      // Also revalidate collections since product changes affect collection pages
      revalidateTag(TAGS.collections, 'max');
      revalidated.push(TAGS.collections);
    } else if (topic.startsWith('collections/')) {
      // Collection created, updated, or deleted
      revalidateTag(TAGS.collections, 'max');
      revalidated.push(TAGS.collections);

      // Also revalidate products since collection membership may change
      revalidateTag(TAGS.products, 'max');
      revalidated.push(TAGS.products);
    } else {
      // Unknown topic -- revalidate everything to be safe
      revalidateTag(TAGS.products, 'max');
      revalidateTag(TAGS.collections, 'max');
      revalidated.push(TAGS.products, TAGS.collections);
    }

    console.log(`[Revalidate] Topic: ${topic} | Tags: ${revalidated.join(', ')} | Product: ${(payload as Record<string, unknown>).title || 'unknown'}`);

    return NextResponse.json({
      revalidated: true,
      tags: revalidated,
      topic,
      now: Date.now(),
    });
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 }
    );
  }
}

// Allow GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Shopify revalidation webhook endpoint. Send POST from Shopify webhooks.',
  });
}
