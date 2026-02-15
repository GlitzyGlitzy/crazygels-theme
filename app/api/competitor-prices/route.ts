import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

/* ------------------------------------------------------------------ */
/*  GET /api/competitor-prices                                         */
/*  Returns competitor price data and coverage statistics               */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { status: 'error', message: 'DATABASE_URL not configured. Run: npx vercel env pull .env.local' },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const withPriceOnly = searchParams.get('with_price') === 'true';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);

    // Overall price coverage stats
    const [stats] = await sql`
      SELECT 
        COUNT(*) as total_products,
        COUNT(retail_price) as with_price,
        COUNT(*) - COUNT(retail_price) as missing_price,
        ROUND(AVG(retail_price)::numeric, 2) as overall_avg,
        ROUND(MIN(retail_price)::numeric, 2) as min_price,
        ROUND(MAX(retail_price)::numeric, 2) as max_price
      FROM product_catalog
    `;

    // Per-category breakdown
    const categoryBreakdown = await sql`
      SELECT 
        category,
        price_tier,
        COUNT(*) as total,
        COUNT(retail_price) as with_price,
        ROUND(AVG(retail_price)::numeric, 2) as avg_price,
        ROUND(MIN(retail_price)::numeric, 2) as min_price,
        ROUND(MAX(retail_price)::numeric, 2) as max_price
      FROM product_catalog
      GROUP BY category, price_tier
      ORDER BY category, price_tier
    `;

    // Products (optionally filtered)
    let products;
    if (category && withPriceOnly) {
      products = await sql`
        SELECT product_hash, display_name, category, product_type, price_tier,
               retail_price, currency, source_url
        FROM product_catalog
        WHERE category = ${category} AND retail_price IS NOT NULL
        ORDER BY retail_price DESC
        LIMIT ${limit}
      `;
    } else if (category) {
      products = await sql`
        SELECT product_hash, display_name, category, product_type, price_tier,
               retail_price, currency, source_url
        FROM product_catalog
        WHERE category = ${category}
        ORDER BY retail_price DESC NULLS LAST
        LIMIT ${limit}
      `;
    } else if (withPriceOnly) {
      products = await sql`
        SELECT product_hash, display_name, category, product_type, price_tier,
               retail_price, currency, source_url
        FROM product_catalog
        WHERE retail_price IS NOT NULL
        ORDER BY retail_price DESC
        LIMIT ${limit}
      `;
    } else {
      products = await sql`
        SELECT product_hash, display_name, category, product_type, price_tier,
               retail_price, currency, source_url
        FROM product_catalog
        ORDER BY display_name
        LIMIT ${limit}
      `;
    }

    return NextResponse.json({
      status: 'success',
      stats: {
        total_products: Number(stats.total_products),
        with_price: Number(stats.with_price),
        missing_price: Number(stats.missing_price),
        coverage_pct: stats.total_products > 0
          ? Math.round((Number(stats.with_price) / Number(stats.total_products)) * 100)
          : 0,
        overall_avg: stats.overall_avg ? Number(stats.overall_avg) : null,
        min_price: stats.min_price ? Number(stats.min_price) : null,
        max_price: stats.max_price ? Number(stats.max_price) : null,
      },
      category_breakdown: categoryBreakdown,
      products,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST /api/competitor-prices                                        */
/*  Bulk update retail prices for catalog products                     */
/*  Body: { prices: [{ product_hash, retail_price, currency?, source_url? }] } */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prices } = body as {
      prices: Array<{
        product_hash: string;
        retail_price: number;
        currency?: string;
        source_url?: string;
      }>;
    };

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      return NextResponse.json(
        { status: 'error', message: 'Missing or empty prices array' },
        { status: 400 },
      );
    }

    let updated = 0;
    let failed = 0;

    for (const entry of prices) {
      if (!entry.product_hash || !entry.retail_price || entry.retail_price <= 0) {
        failed++;
        continue;
      }
      try {
        const result = await sql`
          UPDATE product_catalog
          SET retail_price = ${entry.retail_price},
              currency = ${entry.currency || 'EUR'},
              source_url = ${entry.source_url || null},
              updated_at = NOW()
          WHERE product_hash = ${entry.product_hash}
        `;
        if (result.count > 0) updated++;
        else failed++;
      } catch {
        failed++;
      }
    }

    // After updating prices, refresh the market_benchmarks averages
    await refreshMarketBenchmarks();

    return NextResponse.json({
      status: 'success',
      updated,
      failed,
      total: prices.length,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  Refresh market_benchmarks avg_price from actual catalog prices      */
/* ------------------------------------------------------------------ */

async function refreshMarketBenchmarks() {
  try {
    // Compute real averages from catalog retail prices
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
  } catch (e) {
    console.error('Failed to refresh market benchmarks:', e);
  }
}
