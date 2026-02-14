import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

/**
 * POST /api/competitor-prices/populate
 * 
 * Populates retail_price for product_catalog entries using brand-aware
 * price estimation. Uses known brand price ranges and product type data
 * to compute realistic competitor prices instead of hardcoded tiers.
 *
 * Body: { dryRun?: boolean, overwrite?: boolean }
 */

// ── Brand price knowledge base (EUR retail prices) ──
// Prices based on typical European retail (Sephora, Douglas, etc.)
const BRAND_PRICES: Record<string, { min: number; avg: number; max: number; category?: string }> = {
  // Budget brands
  'the ordinary': { min: 4, avg: 8, max: 16 },
  'ordinary': { min: 4, avg: 8, max: 16 },
  'cerave': { min: 8, avg: 14, max: 22 },
  'cetaphil': { min: 8, avg: 13, max: 20 },
  'nivea': { min: 3, avg: 7, max: 14 },
  'neutrogena': { min: 5, avg: 10, max: 18 },
  'garnier': { min: 4, avg: 8, max: 14 },
  'bioderma': { min: 8, avg: 15, max: 25 },
  'simple': { min: 4, avg: 7, max: 12 },
  'nyx': { min: 5, avg: 9, max: 16 },
  'maybelline': { min: 5, avg: 10, max: 16 },
  'essence': { min: 2, avg: 4, max: 8 },
  'catrice': { min: 3, avg: 6, max: 10 },
  'revolution': { min: 3, avg: 7, max: 14 },
  'elf': { min: 3, avg: 6, max: 12 },
  'e.l.f': { min: 3, avg: 6, max: 12 },
  'tresemme': { min: 4, avg: 7, max: 12 },
  'loreal': { min: 6, avg: 12, max: 22 },
  "l'oreal": { min: 6, avg: 12, max: 22 },
  'rimmel': { min: 4, avg: 7, max: 12 },
  'dove': { min: 3, avg: 6, max: 10 },
  'palmers': { min: 5, avg: 9, max: 14 },
  'palmer': { min: 5, avg: 9, max: 14 },
  'vaseline': { min: 3, avg: 5, max: 9 },
  'dermoviva': { min: 3, avg: 6, max: 10 },
  'bioaqua': { min: 2, avg: 5, max: 9 },
  'byoma': { min: 8, avg: 13, max: 18 },
  'inkey list': { min: 5, avg: 9, max: 15 },
  'inkey': { min: 5, avg: 9, max: 15 },
  'cosrx': { min: 10, avg: 18, max: 28 },

  // Mid-range brands
  'la roche-posay': { min: 12, avg: 22, max: 38 },
  'la roche': { min: 12, avg: 22, max: 38 },
  'vichy': { min: 12, avg: 22, max: 35 },
  'avene': { min: 10, avg: 18, max: 30 },
  'nuxe': { min: 10, avg: 20, max: 35 },
  'caudalie': { min: 12, avg: 25, max: 42 },
  'clinique': { min: 18, avg: 32, max: 52 },
  'kiehl': { min: 15, avg: 30, max: 50 },
  "kiehl's": { min: 15, avg: 30, max: 50 },
  'origins': { min: 15, avg: 28, max: 45 },
  'olay': { min: 10, avg: 20, max: 35 },
  'paula': { min: 10, avg: 22, max: 40 },
  "paula's choice": { min: 10, avg: 22, max: 40 },
  'drunk elephant': { min: 18, avg: 35, max: 55 },
  'dermalogica': { min: 15, avg: 35, max: 65 },
  'strivectin': { min: 20, avg: 40, max: 70 },
  'murad': { min: 20, avg: 38, max: 60 },
  'tatcha': { min: 22, avg: 40, max: 68 },
  'fresh': { min: 15, avg: 32, max: 55 },
  'ole henriksen': { min: 15, avg: 28, max: 45 },
  'it cosmetics': { min: 15, avg: 30, max: 48 },
  'mario badescu': { min: 8, avg: 15, max: 25 },
  'first aid beauty': { min: 10, avg: 22, max: 38 },
  'youth to the people': { min: 15, avg: 30, max: 48 },
  'glow recipe': { min: 15, avg: 28, max: 42 },
  'innisfree': { min: 8, avg: 16, max: 28 },
  'laneige': { min: 12, avg: 25, max: 40 },
  'benefit': { min: 15, avg: 28, max: 40 },
  'too faced': { min: 15, avg: 28, max: 42 },
  'urban decay': { min: 14, avg: 26, max: 42 },
  'nars': { min: 18, avg: 32, max: 48 },
  'mac': { min: 15, avg: 25, max: 38 },
  'bobbi brown': { min: 18, avg: 35, max: 55 },
  'bare minerals': { min: 15, avg: 28, max: 42 },
  'tarte': { min: 15, avg: 28, max: 42 },
  'clarins': { min: 18, avg: 35, max: 60 },
  'shiseido': { min: 20, avg: 40, max: 65 },
  'biotherm': { min: 15, avg: 28, max: 45 },
  'lancome': { min: 20, avg: 38, max: 60 },
  'lancôme': { min: 20, avg: 38, max: 60 },

  // Premium/luxury brands
  'la mer': { min: 60, avg: 150, max: 350 },
  'estee lauder': { min: 25, avg: 55, max: 95 },
  'estée lauder': { min: 25, avg: 55, max: 95 },
  'sk-ii': { min: 50, avg: 120, max: 250 },
  'chanel': { min: 35, avg: 65, max: 120 },
  'dior': { min: 30, avg: 60, max: 110 },
  'sisley': { min: 50, avg: 110, max: 200 },
  'la prairie': { min: 80, avg: 200, max: 500 },
  'tom ford': { min: 35, avg: 65, max: 120 },
  'charlotte tilbury': { min: 18, avg: 38, max: 62 },
  'hourglass': { min: 20, avg: 40, max: 65 },

  // Nail-specific brands
  'opi': { min: 8, avg: 14, max: 22 },
  'essie': { min: 6, avg: 10, max: 16 },
  'sally hansen': { min: 5, avg: 9, max: 14 },
  'orly': { min: 6, avg: 10, max: 16 },
  'zoya': { min: 7, avg: 11, max: 16 },
  'gel-x': { min: 15, avg: 25, max: 40 },
  'dashing diva': { min: 6, avg: 10, max: 16 },
  'ohora': { min: 8, avg: 14, max: 22 },
  'gelato factory': { min: 5, avg: 9, max: 14 },

  // Hair care brands
  'olaplex': { min: 15, avg: 28, max: 40 },
  'moroccanoil': { min: 15, avg: 30, max: 48 },
  'kerastase': { min: 18, avg: 35, max: 55 },
  'kérastase': { min: 18, avg: 35, max: 55 },
  'redken': { min: 10, avg: 20, max: 32 },
  'aveda': { min: 12, avg: 28, max: 45 },
  'bumble': { min: 12, avg: 25, max: 40 },
  'living proof': { min: 12, avg: 25, max: 40 },
  'briogeo': { min: 10, avg: 22, max: 35 },
};

// Product type price multipliers (relative to brand avg)
const TYPE_MULTIPLIERS: Record<string, number> = {
  'serum': 1.2,
  'serums': 1.2,
  'eye-cream': 1.1,
  'eye cream': 1.1,
  'moisturizer': 1.0,
  'moisturizers': 1.0,
  'cleanser': 0.85,
  'cleansers': 0.85,
  'toner': 0.85,
  'toners': 0.85,
  'sunscreen': 0.9,
  'spf': 0.9,
  'mask': 0.95,
  'masks': 0.95,
  'face-masks': 0.95,
  'lip': 0.7,
  'lip-care': 0.7,
  'body': 0.8,
  'body-care': 0.8,
  'hair': 0.9,
  'haircare': 0.9,
  'shampoo': 0.85,
  'conditioner': 0.85,
  'nail': 0.75,
  'nails': 0.75,
  'nail-wraps': 0.75,
  'skincare': 1.0,
  'fragrance': 1.3,
  'perfume': 1.4,
};

// Fallback tier ranges when no brand is recognized (EUR)
const TIER_RANGES: Record<string, { min: number; avg: number; max: number }> = {
  budget:  { min: 3,  avg: 9,   max: 18 },
  mid:     { min: 10, avg: 24,  max: 45 },
  premium: { min: 30, avg: 55,  max: 90 },
  luxury:  { min: 60, avg: 130, max: 280 },
};

/**
 * Extract the brand from a display_name.
 * Many names are "BrandProduct Name" (no space) or "Brand Product Name".
 */
function extractBrand(displayName: string): string | null {
  const lower = displayName.toLowerCase().trim();
  
  // Check longest brand names first (multi-word)
  const sortedBrands = Object.keys(BRAND_PRICES).sort((a, b) => b.length - a.length);
  for (const brand of sortedBrands) {
    if (lower.startsWith(brand) || lower.includes(brand)) {
      return brand;
    }
  }
  return null;
}

/**
 * Estimate a realistic retail price for a catalog product.
 * Uses brand knowledge + product type multipliers + small randomization.
 */
function estimatePrice(
  displayName: string,
  category: string | null,
  productType: string | null,
  priceTier: string | null,
): { price: number; brand: string | null; method: string } {
  const brand = extractBrand(displayName);

  let baseRange: { min: number; avg: number; max: number };
  let method: string;

  if (brand && BRAND_PRICES[brand]) {
    baseRange = BRAND_PRICES[brand];
    method = `brand:${brand}`;
  } else if (priceTier && TIER_RANGES[priceTier]) {
    baseRange = TIER_RANGES[priceTier];
    method = `tier:${priceTier}`;
  } else {
    baseRange = TIER_RANGES['mid'];
    method = 'tier:mid(fallback)';
  }

  // Apply product type multiplier
  const typeKey = (productType || category || '').toLowerCase();
  const multiplier = TYPE_MULTIPLIERS[typeKey] || 1.0;
  
  // Compute price with some controlled variance (+-15% from avg)
  // Use a deterministic hash based on display_name so prices are stable
  const nameHash = displayName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variance = ((nameHash % 30) - 15) / 100; // -0.15 to +0.15
  
  const rawPrice = baseRange.avg * multiplier * (1 + variance);
  
  // Clamp to brand/tier range
  const clampedPrice = Math.max(baseRange.min, Math.min(baseRange.max, rawPrice));
  
  // Round to .99 or .49 for realism
  const rounded = clampedPrice < 10
    ? Math.floor(clampedPrice) + 0.99
    : Math.round(clampedPrice * 2) / 2 - 0.01; // e.g., 14.49, 14.99
  
  const finalPrice = Math.round(Math.max(1.99, rounded) * 100) / 100;

  return { price: finalPrice, brand, method };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;
    const overwrite = body.overwrite === true;

    // Fetch all catalog products (optionally only those without prices)
    const products = overwrite
      ? await sql`SELECT product_hash, display_name, category, product_type, price_tier FROM product_catalog`
      : await sql`SELECT product_hash, display_name, category, product_type, price_tier FROM product_catalog WHERE retail_price IS NULL`;

    const estimates: Array<{
      product_hash: string;
      display_name: string;
      price: number;
      brand: string | null;
      method: string;
    }> = [];

    for (const p of products) {
      const { price, brand, method } = estimatePrice(
        p.display_name,
        p.category,
        p.product_type,
        p.price_tier,
      );
      estimates.push({
        product_hash: p.product_hash,
        display_name: p.display_name,
        price,
        brand,
        method,
      });
    }

    let updated = 0;

    if (!dryRun && estimates.length > 0) {
      // Batch update in groups of 50
      const BATCH = 50;
      for (let i = 0; i < estimates.length; i += BATCH) {
        const batch = estimates.slice(i, i + BATCH);
        for (const est of batch) {
          await sql`
            UPDATE product_catalog
            SET retail_price = ${est.price},
                currency = 'EUR',
                updated_at = NOW()
            WHERE product_hash = ${est.product_hash}
          `;
          updated++;
        }
      }

      // Refresh market_benchmarks with real averages
      const averages = await sql`
        SELECT product_type, price_tier,
               ROUND(AVG(retail_price)::numeric, 2) as avg_price,
               COUNT(*) as product_count
        FROM product_catalog
        WHERE retail_price IS NOT NULL AND retail_price > 0
        GROUP BY product_type, price_tier
      `;

      for (const row of averages) {
        await sql`
          INSERT INTO market_benchmarks (product_type, price_tier, avg_price, product_count, updated_at)
          VALUES (${row.product_type}, ${row.price_tier}, ${row.avg_price}, ${row.product_count}, NOW())
          ON CONFLICT (product_type, price_tier) DO UPDATE SET
            avg_price = EXCLUDED.avg_price,
            product_count = EXCLUDED.product_count,
            updated_at = NOW()
        `;
      }
    }

    // Summary statistics
    const brandMatched = estimates.filter(e => e.brand !== null).length;
    const tierFallback = estimates.filter(e => e.brand === null).length;
    const pricesByMethod: Record<string, number> = {};
    for (const e of estimates) {
      const key = e.method.split(':')[0];
      pricesByMethod[key] = (pricesByMethod[key] || 0) + 1;
    }

    return NextResponse.json({
      status: 'success',
      dryRun,
      total: estimates.length,
      updated,
      brand_matched: brandMatched,
      tier_fallback: tierFallback,
      by_method: pricesByMethod,
      // Include sample estimates in dry run
      ...(dryRun ? { sample: estimates.slice(0, 30) } : {}),
    });
  } catch (error) {
    console.error('Price population error:', error);
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
