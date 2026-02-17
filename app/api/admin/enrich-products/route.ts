import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

/**
 * POST /api/admin/enrich-products
 *
 * Enriches product_catalog rows that are missing prices, images, and source URLs.
 *
 * Strategy:
 * 1. Prices: Set retail_price based on price_tier using the same margin map as list-product.ts
 * 2. Images: Search Open Beauty Facts API by product name to find product images
 * 3. Source URLs: Build Open Beauty Facts product URLs for matched products
 *
 * Accepts optional { batch_size, dry_run } in the body.
 */

function verifyAdmin(req: NextRequest): boolean {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.ADMIN_TOKEN;
}

// Price suggestions based on tier -- ONLY used when user explicitly clicks "Set Prices"
// These are suggestions for YOUR selling prices (with margin), not market research prices.
// The scraper should provide real market prices; these are a fallback for listing on Shopify.
const TIER_SELLING_PRICES: Record<string, number> = {
  budget: 14.99,
  mid: 24.99,
  premium: 39.99,
  luxury: 59.99,
};

interface CatalogRow {
  product_hash: string;
  display_name: string;
  category: string;
  price_tier: string;
  image_url: string | null;
  retail_price: number | null;
  source_url: string | null;
  source: string | null;
}

interface OpenBeautyFactsProduct {
  product_name?: string;
  image_url?: string;
  image_front_url?: string;
  image_small_url?: string;
  code?: string;
  brands?: string;
}

/**
 * Search Open Beauty Facts for a product by name and return the best image match.
 */
async function searchOpenBeautyFacts(
  productName: string
): Promise<{ imageUrl: string; sourceUrl: string } | null> {
  try {
    // Clean up the product name for search
    const searchTerms = productName
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .slice(0, 5) // Use first 5 words for search
      .join(" ");

    const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&search_simple=1&action=process&json=1&page_size=3`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrazyGelsIntelligence/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const products = (data.products || []) as OpenBeautyFactsProduct[];

    // Find the first product with an image
    for (const p of products) {
      const img = p.image_front_url || p.image_url || p.image_small_url;
      if (img) {
        const code = p.code || "";
        const sourceUrl = code
          ? `https://world.openbeautyfacts.org/product/${code}`
          : `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchTerms)}&action=process`;
        return { imageUrl: img, sourceUrl };
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Number(body.batch_size) || 50, 200);
    const dryRun = body.dry_run === true;
    const priceOnly = body.price_only === true;

    // Get products missing data
    const products = await sql<CatalogRow[]>`
      SELECT product_hash, display_name, category, price_tier,
             image_url, retail_price, source_url, source
      FROM product_catalog
      WHERE retail_price IS NULL
         OR retail_price = 0
         OR (image_url IS NULL AND ${!priceOnly})
      ORDER BY efficacy_score DESC NULLS LAST
      LIMIT ${batchSize}
    `;

    if (products.length === 0) {
      return NextResponse.json({
        message: "All products are already enriched",
        enriched: 0,
        total_remaining: 0,
      });
    }

    let enrichedCount = 0;
    let pricesSet = 0;
    let imagesFound = 0;
    const errors: string[] = [];

    for (const product of products) {
      try {
        // 1. Set price from tier if missing AND price_only mode is requested
        // In normal enrichment, we only fill images -- prices come from the scraper.
        // Only assign tier prices when explicitly asked (price_only mode = "Set Prices" button).
        let newPrice = product.retail_price;
        if (priceOnly && (!newPrice || Number(newPrice) === 0)) {
          newPrice = TIER_SELLING_PRICES[product.price_tier] || TIER_SELLING_PRICES.mid;
          pricesSet++;
        }

        // 2. Search for image if missing (skip if price_only mode)
        let newImageUrl = product.image_url;
        let newSourceUrl = product.source_url;

        if (!priceOnly && !newImageUrl) {
          const result = await searchOpenBeautyFacts(product.display_name);
          if (result) {
            newImageUrl = result.imageUrl;
            newSourceUrl = newSourceUrl || result.sourceUrl;
            imagesFound++;
          }
        }

        // 3. Update the database
        if (!dryRun) {
          await sql`
            UPDATE product_catalog
            SET retail_price = ${newPrice},
                currency = COALESCE(currency, 'EUR'),
                image_url = COALESCE(${newImageUrl}, image_url),
                source_url = COALESCE(${newSourceUrl}, source_url),
                updated_at = NOW()
            WHERE product_hash = ${product.product_hash}
          `;
        }

        enrichedCount++;
      } catch (err) {
        errors.push(
          `${product.display_name}: ${err instanceof Error ? err.message : "Unknown error"}`
        );
      }
    }

    // Count remaining unenriched
    const remaining = await sql<{ count: string }[]>`
      SELECT COUNT(*) as count FROM product_catalog
      WHERE retail_price IS NULL OR retail_price = 0
    `;

    return NextResponse.json({
      message: dryRun ? "Dry run complete" : "Enrichment complete",
      enriched: enrichedCount,
      prices_set: pricesSet,
      images_found: imagesFound,
      errors: errors.length > 0 ? errors : undefined,
      total_remaining: Number(remaining[0]?.count || 0),
      batch_size: batchSize,
    });
  } catch (error) {
    console.error("[enrich-products] Error:", error);
    return NextResponse.json(
      { error: "Failed to enrich products", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/enrich-products
 * Returns stats on enrichment progress.
 */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await sql<{
      total: string;
      has_price: string;
      has_image: string;
      has_source_url: string;
      complete: string;
    }[]>`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN retail_price IS NOT NULL AND retail_price > 0 THEN 1 END) as has_price,
        COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as has_image,
        COUNT(CASE WHEN source_url IS NOT NULL THEN 1 END) as has_source_url,
        COUNT(CASE WHEN retail_price > 0 AND image_url IS NOT NULL THEN 1 END) as complete
      FROM product_catalog
    `;

    const s = stats[0];
    return NextResponse.json({
      total: Number(s.total),
      has_price: Number(s.has_price),
      has_image: Number(s.has_image),
      has_source_url: Number(s.has_source_url),
      complete: Number(s.complete),
      missing_price: Number(s.total) - Number(s.has_price),
      missing_image: Number(s.total) - Number(s.has_image),
    });
  } catch (error) {
    console.error("[enrich-products] Stats error:", error);
    return NextResponse.json(
      { error: "Failed to get enrichment stats" },
      { status: 500 }
    );
  }
}
