import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(
  /^https?:\/\//,
  ""
).replace(/\/$/, "");
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const ADMIN_API_VERSION = "2024-01";

// Google benchmark prices by category (from our analysis)
const CATEGORY_BENCHMARKS: Record<string, number> = {
  skincare: 57.87,
  cream: 35.99,
  serum: 42.99,
  moisturizers: 29.99,
  cleansers: 19.99,
  toners: 22.99,
  sunscreens: 18.99,
  "shampoo-conditioner": 16.99,
  shampoos: 14.99,
  conditioners: 14.99,
  foundations: 24.99,
  concealers: 19.99,
  mascaras: 14.99,
  lipsticks: 16.99,
  primers: 22.99,
  bronzers: 24.99,
  lip_balms: 9.99,
  body_lotions: 16.99,
  hand_creams: 12.99,
  eye_creams: 29.99,
  "face-masks": 19.99,
  face_masks: 19.99,
  exfoliators: 24.99,
};

// Price tier multipliers for competitive positioning (slightly under market)
const TIER_MULTIPLIER: Record<string, number> = {
  budget: 0.85,
  mid: 0.90,
  premium: 0.92,
  luxury: 0.95,
};

function getCompetitivePrice(category: string, priceTier: string): string {
  const benchmark = CATEGORY_BENCHMARKS[category] || 24.99;
  const multiplier = TIER_MULTIPLIER[priceTier] || 0.90;
  const price = benchmark * multiplier;
  // Round to .99 pricing
  return (Math.ceil(price) - 0.01).toFixed(2);
}

async function shopifyAdminFetch<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: Record<string, unknown>
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
    const errorText = await res.text();
    throw new Error(`Shopify API ${res.status}: ${errorText}`);
  }
  return res.json() as Promise<T>;
}

function generateProductHtml(product: {
  display_name: string;
  brand: string | null;
  category: string;
}): string {
  const brandLine = product.brand
    ? `<p><strong>Brand:</strong> ${product.brand}</p>`
    : "";
  return `
    <div>
      ${brandLine}
      <p>Expertly selected by Crazy Gels for the <strong>${product.category}</strong> category.
      Curated by our AI beauty consultant to match your unique skin, hair, and nail needs.</p>
      <p><em>Free shipping. GDPR compliant. Satisfaction guaranteed.</em></p>
    </div>
  `.trim();
}

function extractToken(request: NextRequest): string | null {
  const xToken = request.headers.get("x-admin-token");
  if (xToken) return xToken;
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function POST(request: NextRequest) {
  const adminToken = extractToken(request);
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
    return NextResponse.json(
      { error: "Shopify Admin API not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const batchSize = Math.min(body.batch_size || 10, 25); // max 25 per call to avoid timeouts
    const activateImmediately = body.activate !== false; // default true
    const defaultInventory = body.inventory || 50;

    // Find products with images that haven't been listed yet
    const products = await sql<
      {
        product_hash: string;
        display_name: string;
        brand: string | null;
        category: string;
        price_tier: string;
        image_url: string;
        retail_price: number | null;
        price_original: number | null;
        key_actives: string[];
        suitable_for: string[];
        description_generated: string | null;
        efficacy_score: number;
      }[]
    >`
      SELECT product_hash, display_name, brand, category, price_tier,
             image_url, retail_price, price_original, key_actives,
             suitable_for, description_generated, efficacy_score
      FROM product_catalog
      WHERE image_url IS NOT NULL AND image_url != ''
        AND status != 'listed'
      ORDER BY
        CASE WHEN brand IS NOT NULL AND brand != '' THEN 0 ELSE 1 END,
        category,
        display_name
      LIMIT ${batchSize}
    `;

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No more products to list. All products with images have been listed.",
        listed: 0,
        remaining: 0,
      });
    }

    // Count remaining for progress tracking
    const remaining = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int as count FROM product_catalog
      WHERE image_url IS NOT NULL AND image_url != '' AND status != 'listed'
    `;

    const results: {
      product_hash: string;
      name: string;
      shopify_id: string;
      price: string;
      status: string;
    }[] = [];
    const errors: { product_hash: string; name: string; error: string }[] = [];

    // Get active location once (for inventory)
    let activeLocationId: number | null = null;
    if (activateImmediately) {
      const locations = await shopifyAdminFetch<{
        locations: Array<{ id: number; active: boolean }>;
      }>("/locations.json");
      activeLocationId =
        locations.locations.find((l) => l.active)?.id ?? null;
    }

    for (const product of products) {
      try {
        // Calculate competitive price
        const retailPrice =
          product.retail_price && Number(product.retail_price) > 0
            ? Number(product.retail_price).toFixed(2)
            : getCompetitivePrice(product.category, product.price_tier);

        // Build tags
        const tags = [
          "ai-curated",
          product.category,
          product.price_tier,
          ...(product.brand ? [product.brand] : []),
          ...(product.key_actives || []),
          ...(product.suitable_for || []).map((s: string) => `skin-${s}`),
        ]
          .filter(Boolean)
          .join(", ");

        // Create on Shopify
        const shopifyRes = await shopifyAdminFetch<{
          product: {
            id: number;
            handle: string;
            variants: Array<{
              id: number;
              inventory_item_id: number;
            }>;
          };
        }>("/products.json", "POST", {
          product: {
            title: product.display_name,
            body_html:
              product.description_generated ||
              generateProductHtml(product),
            vendor: product.brand || "Crazy Gels Select",
            product_type: product.category,
            tags,
            status: activateImmediately ? "active" : "draft",
            variants: [
              {
                price: retailPrice,
                inventory_quantity: 0,
                inventory_management: "shopify",
                fulfillment_service: "manual",
                requires_shipping: true,
              },
            ],
            images: [{ src: product.image_url }],
          },
        });

        const shopifyId = String(shopifyRes.product.id);

        // Set inventory and activate
        if (activateImmediately && activeLocationId) {
          const inventoryItemId =
            shopifyRes.product.variants[0]?.inventory_item_id;
          if (inventoryItemId) {
            await shopifyAdminFetch("/inventory_levels/set.json", "POST", {
              location_id: activeLocationId,
              inventory_item_id: inventoryItemId,
              available: defaultInventory,
            });
          }
        }

        // Update catalog status
        await sql`
          UPDATE product_catalog
          SET status = 'listed',
              retail_price = ${Number(retailPrice)},
              updated_at = NOW()
          WHERE product_hash = ${product.product_hash}
        `;

        results.push({
          product_hash: product.product_hash,
          name: product.display_name,
          shopify_id: shopifyId,
          price: retailPrice,
          status: activateImmediately ? "active" : "draft",
        });

        // Small delay to respect Shopify rate limits (2 calls/sec for REST)
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        errors.push({
          product_hash: product.product_hash,
          name: product.display_name,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      listed: results.length,
      failed: errors.length,
      remaining: (remaining[0]?.count || 0) - results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Bulk list error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to bulk list",
      },
      { status: 500 }
    );
  }
}

// GET: Check how many products are ready to list
export async function GET(request: NextRequest) {
  const adminToken = extractToken(request);
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await sql<
    { category: string; ready: number; listed: number }[]
  >`
    SELECT category,
      COUNT(*) FILTER (WHERE status != 'listed' AND image_url IS NOT NULL AND image_url != '')::int as ready,
      COUNT(*) FILTER (WHERE status = 'listed')::int as listed
    FROM product_catalog
    WHERE image_url IS NOT NULL AND image_url != ''
    GROUP BY category
    ORDER BY ready DESC
  `;

  const totalReady = stats.reduce((s, r) => s + r.ready, 0);
  const totalListed = stats.reduce((s, r) => s + r.listed, 0);

  return NextResponse.json({
    total_ready: totalReady,
    total_listed: totalListed,
    categories: stats,
  });
}
