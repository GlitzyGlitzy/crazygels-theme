import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { TAGS } from '@/lib/shopify/constants';

/**
 * Shopify Webhook Revalidation Endpoint
 * 
 * When you update a product/collection in Shopify, this webhook fires
 * and instantly purges the cached data so the site shows the new
 * price, description, image, etc. immediately (no 5-min wait).
 *
 * Setup in Shopify Admin:
 *   Settings > Notifications > Webhooks > Create webhook
 *   - Event: Product update, Product create, Product delete,
 *            Collection update, Collection create, Collection delete
 *   - Format: JSON
 *   - URL: https://crazygels.com/api/revalidate
 *
 * Also set SHOPIFY_REVALIDATION_SECRET env var to match Shopify's webhook secret.
 */

export async function POST(req: NextRequest) {
  try {
    // Verify the request is from Shopify using the shared secret
    const secret = process.env.SHOPIFY_REVALIDATION_SECRET;
    
    // Read the body
    const body = await req.text();

    // Verify HMAC if secret is set
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
    
    // Parse the payload
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(body);
    } catch {
      // Body might be empty for delete events
    }

    // Revalidate based on topic
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
