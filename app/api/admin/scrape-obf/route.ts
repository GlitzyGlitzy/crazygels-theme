import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import crypto from "crypto";

/**
 * POST /api/admin/scrape-obf
 *
 * Scrapes Open Beauty Facts for beauty products and writes FULL data
 * (name, brand, image, ingredients, barcode) to scrape_staging + product_catalog.
 *
 * OBF is a free open database -- no API key needed.
 * Prices are set from brand knowledge since OBF doesn't track retail prices.
 *
 * Body: { categories?: string[], page_size?: number, pages?: number }
 */

const USD_TO_EUR = 0.92;

function verifyAdmin(req: NextRequest): boolean {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.ADMIN_TOKEN;
}

// Brand -> typical EUR price range (midpoint used as retail_price)
const BRAND_PRICES: Record<string, { price: number; tier: string }> = {
  // Luxury
  "la mer": { price: 89.99, tier: "luxury" },
  "la prairie": { price: 119.99, tier: "luxury" },
  "sk-ii": { price: 95.0, tier: "luxury" },
  sisley: { price: 85.0, tier: "luxury" },
  chanel: { price: 69.99, tier: "luxury" },
  dior: { price: 65.0, tier: "luxury" },
  "tom ford": { price: 79.99, tier: "luxury" },
  guerlain: { price: 72.0, tier: "luxury" },
  "estee lauder": { price: 55.0, tier: "luxury" },
  "estée lauder": { price: 55.0, tier: "luxury" },
  shiseido: { price: 52.0, tier: "luxury" },
  // Premium
  clinique: { price: 38.0, tier: "premium" },
  origins: { price: 35.0, tier: "premium" },
  "kiehl's": { price: 36.0, tier: "premium" },
  lancome: { price: 45.0, tier: "premium" },
  "lancôme": { price: 45.0, tier: "premium" },
  clarins: { price: 42.0, tier: "premium" },
  "drunk elephant": { price: 39.0, tier: "premium" },
  "paula's choice": { price: 34.0, tier: "premium" },
  murad: { price: 42.0, tier: "premium" },
  "ole henriksen": { price: 32.0, tier: "premium" },
  "tatcha": { price: 48.0, tier: "premium" },
  biotherm: { price: 35.0, tier: "premium" },
  vichy: { price: 28.0, tier: "premium" },
  // Mid-range
  "la roche-posay": { price: 22.0, tier: "mid" },
  cerave: { price: 16.0, tier: "mid" },
  "the ordinary": { price: 12.0, tier: "mid" },
  "the inkey list": { price: 11.0, tier: "mid" },
  neutrogena: { price: 14.0, tier: "mid" },
  olay: { price: 18.0, tier: "mid" },
  nivea: { price: 8.0, tier: "mid" },
  "l'oreal": { price: 15.0, tier: "mid" },
  "l'oréal": { price: 15.0, tier: "mid" },
  garnier: { price: 9.0, tier: "mid" },
  eucerin: { price: 18.0, tier: "mid" },
  bioderma: { price: 16.0, tier: "mid" },
  nuxe: { price: 22.0, tier: "mid" },
  avene: { price: 18.0, tier: "mid" },
  "avène": { price: 18.0, tier: "mid" },
  caudalie: { price: 24.0, tier: "mid" },
  // Budget
  "e.l.f.": { price: 8.0, tier: "budget" },
  essence: { price: 5.0, tier: "budget" },
  catrice: { price: 6.0, tier: "budget" },
  nyx: { price: 9.0, tier: "budget" },
  "wet n wild": { price: 5.0, tier: "budget" },
};

function getPriceFromBrand(brand: string): { price: number; tier: string } {
  const brandLower = (brand || "").toLowerCase().trim();
  for (const [key, val] of Object.entries(BRAND_PRICES)) {
    if (brandLower.includes(key) || key.includes(brandLower)) {
      return val;
    }
  }
  // Default mid-range price
  return { price: 19.99, tier: "mid" };
}

// OBF search categories
const OBF_CATEGORIES = [
  "face-creams",
  "face-serums",
  "cleansers",
  "moisturizers",
  "sunscreens",
  "lip-care",
  "eye-care",
  "face-masks",
  "body-lotions",
  "hand-creams",
  "shampoos",
  "conditioners",
  "body-washes",
  "deodorants",
  "nail-polish",
  "foundations",
  "lipsticks",
  "mascaras",
  "perfumes",
];

const CATEGORY_MAP: Record<string, string> = {
  "face-creams": "skincare-moisturizers",
  "face-serums": "skincare-serums",
  cleansers: "skincare-cleansers",
  moisturizers: "skincare-moisturizers",
  sunscreens: "skincare-sun",
  "lip-care": "skincare-lip",
  "eye-care": "skincare-eye",
  "face-masks": "skincare-masks",
  "body-lotions": "body-care",
  "hand-creams": "body-care",
  shampoos: "hair-shampoo",
  conditioners: "hair-conditioner",
  "body-washes": "body-care",
  deodorants: "body-care",
  "nail-polish": "nail-polish",
  foundations: "makeup-face",
  lipsticks: "makeup-lips",
  mascaras: "makeup-eyes",
  perfumes: "fragrances",
};

interface OBFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  image_front_url?: string;
  image_front_small_url?: string;
  image_small_url?: string;
  categories_tags?: string[];
  ingredients_text?: string;
  quantity?: string;
}

async function searchOBF(
  category: string,
  page: number,
  pageSize: number
): Promise<OBFProduct[]> {
  const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(category)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "CrazyGels/1.0 (contact@crazygels.com)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.products || []) as OBFProduct[];
  } catch {
    return [];
  }
}

function makeHash(source: string, id: string, name: string): string {
  return crypto
    .createHash("sha256")
    .update(`${source}:${id}:${name}`)
    .digest("hex")
    .slice(0, 16);
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL not configured" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const categories = (body.categories as string[]) || OBF_CATEGORIES;
  const pageSize = Math.min(body.page_size || 50, 100);
  const pages = Math.min(body.pages || 1, 5);

  let totalScraped = 0;
  let totalInserted = 0;
  let totalWithImages = 0;
  let totalWithPrices = 0;
  const errors: string[] = [];

  for (const category of categories) {
    for (let page = 1; page <= pages; page++) {
      const products = await searchOBF(category, page, pageSize);
      if (products.length === 0) break;

      for (const p of products) {
        totalScraped++;
        const name = p.product_name?.trim();
        if (!name || name.length < 3) continue;

        const barcode = p.code || "";
        const productHash = makeHash(
          "open_beauty_facts",
          barcode || name,
          name
        );
        const brand = p.brands?.split(",")[0]?.trim() || "";
        const imageUrl =
          p.image_front_url || p.image_url || p.image_front_small_url || null;
        const catalogCategory =
          CATEGORY_MAP[category] || "skincare-general";
        const { price, tier } = getPriceFromBrand(brand);
        const retailPriceEur = price;

        try {
          // 1. Write to scrape_staging (full raw data)
          await sql`
            INSERT INTO scrape_staging (
              product_hash, source, source_product_id, name_original, brand,
              category, price_original, price_currency, image_url, source_url,
              description, ingredients, rating, review_count, in_stock, scraped_at
            ) VALUES (
              ${productHash}, 'open_beauty_facts', ${barcode}, ${name}, ${brand},
              ${catalogCategory}, ${retailPriceEur}, 'EUR', ${imageUrl},
              ${barcode ? `https://world.openbeautyfacts.org/product/${barcode}` : null},
              ${null}, ${p.ingredients_text || null}, ${null}, ${null}, ${true}, NOW()
            )
            ON CONFLICT (product_hash) DO UPDATE SET
              image_url = COALESCE(EXCLUDED.image_url, scrape_staging.image_url),
              ingredients = COALESCE(EXCLUDED.ingredients, scrape_staging.ingredients),
              scraped_at = NOW()
          `;

          // 2. Promote to product_catalog with REAL data
          await sql`
            INSERT INTO product_catalog (
              product_hash, display_name, category, product_type, price_tier,
              image_url, description_generated, source_url,
              retail_price, currency, source, status,
              key_actives, suitable_for, contraindications,
              created_at, updated_at
            ) VALUES (
              ${productHash}, ${name.slice(0, 255)}, ${catalogCategory},
              ${catalogCategory.split("-").pop() || "skincare"},
              ${tier}, ${imageUrl}, ${null},
              ${barcode ? `https://world.openbeautyfacts.org/product/${barcode}` : null},
              ${retailPriceEur}, 'EUR', 'open_beauty_facts', 'research',
              ${[] as string[]}, ${[] as string[]}, ${[] as string[]},
              NOW(), NOW()
            )
            ON CONFLICT (product_hash) DO UPDATE SET
              image_url = COALESCE(EXCLUDED.image_url, product_catalog.image_url),
              retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price),
              currency = COALESCE(EXCLUDED.currency, product_catalog.currency),
              source_url = COALESCE(EXCLUDED.source_url, product_catalog.source_url),
              updated_at = NOW()
          `;

          totalInserted++;
          if (imageUrl) totalWithImages++;
          if (retailPriceEur > 0) totalWithPrices++;
        } catch (err) {
          errors.push(
            `${name.slice(0, 40)}: ${err instanceof Error ? err.message : "unknown"}`
          );
        }
      }

      // Be polite to OBF API
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return NextResponse.json({
    status: "success",
    scraped: totalScraped,
    inserted: totalInserted,
    with_images: totalWithImages,
    with_prices: totalWithPrices,
    errors: errors.slice(0, 20),
    categories_searched: categories.length,
  });
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return staging stats
  const stats = await sql`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as with_images,
      COUNT(CASE WHEN price_original > 0 THEN 1 END) as with_prices,
      COUNT(DISTINCT source) as sources,
      MAX(scraped_at) as last_scraped
    FROM scrape_staging
  `;

  return NextResponse.json({
    staging: stats[0] || { total: 0 },
  });
}
