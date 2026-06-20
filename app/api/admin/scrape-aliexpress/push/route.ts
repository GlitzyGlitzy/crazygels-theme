import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, unauthorized } from "@/lib/admin-auth";

/**
 * POST /api/admin/scrape-aliexpress/push
 *
 * Takes AliExpress staging JSON (from aliexpress_intelligence_staging.json)
 * and creates products directly on Shopify — no DB enrichment pipeline required.
 *
 * Body:
 *   products   — array from staging JSON
 *   markup     — price multiplier applied to AliExpress price (default: 2.5)
 *   min_price  — floor price in EUR (default: 9.99)
 *   status     — "active" | "draft" (default: "draft")
 *   inventory  — units to set at active location (default: 50)
 *   batch_size — max products to push per call (default: 10, max: 25)
 */

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const ADMIN_API_VERSION = "2024-01";

// Category benchmark retail prices (EUR) — used when AliExpress price is 0
const CATEGORY_BENCHMARKS: Record<string, number> = {
  nail_care: 14.99,
  skincare: 24.99,
  serums: 29.99,
  moisturizers: 19.99,
  haircare: 16.99,
  fragrances: 39.99,
  face_masks: 12.99,
  toners: 14.99,
  shampoo_conditioner: 12.99,
};

async function shopifyFetch<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<T> {
  const url = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN!,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

function computePrice(
  aliPrice: number,
  category: string,
  markup: number,
  minPrice: number
): string {
  let price: number;
  if (aliPrice > 0) {
    price = aliPrice * markup;
  } else {
    price = CATEGORY_BENCHMARKS[category] ?? 19.99;
  }
  price = Math.max(price, minPrice);
  // Round to .99 pricing
  return (Math.ceil(price) - 0.01).toFixed(2);
}

function buildDescription(product: StagingProduct): string {
  const lines: string[] = [];

  if (product.brand && product.brand !== "Unknown") {
    lines.push(`<p><strong>Brand / Seller:</strong> ${product.brand}</p>`);
  }
  if (product.description) {
    lines.push(`<p>${product.description}</p>`);
  }
  if (product.rating && product.review_count) {
    lines.push(
      `<p><strong>Rating:</strong> ${product.rating}/5 (${product.review_count.toLocaleString()} reviews on AliExpress)</p>`
    );
  }
  lines.push(`<p><em>Sourced and curated by Crazy Gels. Ships worldwide.</em></p>`);
  return lines.join("\n");
}

interface StagingProduct {
  product_hash?: string;
  source_product_id?: string;
  name_original: string;
  brand?: string;
  category?: string;
  price_original?: number;
  price_currency?: string;
  image_url?: string;
  source_url?: string;
  description?: string;
  ingredients?: string | null;
  rating?: number | null;
  review_count?: number | null;
  in_stock?: boolean;
  sale_price?: number | null;
  scraped_at?: string;
}

interface PushResult {
  name: string;
  shopify_id: string;
  price: string;
  status: string;
}

interface PushError {
  name: string;
  error: string;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const products: StagingProduct[] = body.products || [];
  const markup: number = Math.max(1, body.markup ?? 2.5);
  const minPrice: number = body.min_price ?? 9.99;
  const status: "active" | "draft" = body.status === "active" ? "active" : "draft";
  const inventory: number = body.inventory ?? 50;
  const batchSize: number = Math.min(body.batch_size ?? 10, 25);

  if (products.length === 0) {
    return NextResponse.json({ error: "No products provided." }, { status: 400 });
  }

  const batch = products.slice(0, batchSize);
  const results: PushResult[] = [];
  const errors: PushError[] = [];

  // Get active location for inventory setting
  let activeLocationId: number | null = null;
  try {
    const locs = await shopifyFetch<{ locations: Array<{ id: number; active: boolean }> }>("/locations.json");
    activeLocationId = locs.locations.find((l) => l.active)?.id ?? null;
  } catch {
    // continue without inventory setting
  }

  for (const product of batch) {
    const name = product.name_original?.trim();
    if (!name) continue;

    const category = product.category ?? "nail_care";
    const price = computePrice(product.price_original ?? 0, category, markup, minPrice);

    const tags = [
      "aliexpress",
      "ai-sourced",
      category,
      ...(product.brand && product.brand !== "Unknown" ? [product.brand] : []),
    ].filter(Boolean).join(", ");

    try {
      const shopifyBody = {
        product: {
          title: name,
          body_html: buildDescription(product),
          vendor: product.brand && product.brand !== "Unknown" ? product.brand : "Crazy Gels Select",
          product_type: category,
          tags,
          status,
          variants: [
            {
              price,
              ...(product.sale_price && product.sale_price > 0
                ? { compare_at_price: price }
                : {}),
              inventory_quantity: 0,
              inventory_management: "shopify",
              fulfillment_service: "manual",
              requires_shipping: true,
            },
          ],
          ...(product.image_url
            ? { images: [{ src: product.image_url }] }
            : {}),
        },
      };

      const res = await shopifyFetch<{
        product: { id: number; variants: Array<{ id: number; inventory_item_id: number }> };
      }>("/products.json", "POST", shopifyBody);

      const shopifyId = String(res.product.id);

      // Set inventory
      if (activeLocationId && inventory > 0) {
        const inventoryItemId = res.product.variants[0]?.inventory_item_id;
        if (inventoryItemId) {
          await shopifyFetch("/inventory_levels/set.json", "POST", {
            location_id: activeLocationId,
            inventory_item_id: inventoryItemId,
            available: inventory,
          }).catch(() => null);
        }
      }

      results.push({ name, shopify_id: shopifyId, price, status });

      // Respect Shopify REST rate limit (2 req/s)
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      errors.push({
        name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    pushed: results.length,
    failed: errors.length,
    remaining: Math.max(0, products.length - batchSize),
    markup_applied: markup,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
