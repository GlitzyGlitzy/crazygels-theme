import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST() {
  try {
    // Enable pg_trgm extension for fuzzy matching
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`;

    // Create product_catalog table
    await sql`
      CREATE TABLE IF NOT EXISTS product_catalog (
        id SERIAL PRIMARY KEY,
        product_hash VARCHAR(64) UNIQUE NOT NULL,
        display_name VARCHAR(500) NOT NULL,
        category VARCHAR(100),
        product_type VARCHAR(50),
        price_tier VARCHAR(50),
        efficacy_score NUMERIC(4,2),
        review_signals VARCHAR(50) DEFAULT 'stable',
        key_actives TEXT[],
        ingredient_summary JSONB DEFAULT '{}',
        suitable_for TEXT[],
        contraindications TEXT[],
        image_url TEXT,
        description_generated TEXT,
        status VARCHAR(20) DEFAULT 'research',
        acquisition_lead VARCHAR(64),
        source VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_hash ON product_catalog(product_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_category ON product_catalog(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_type ON product_catalog(product_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_status ON product_catalog(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_source ON product_catalog(source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_price_tier ON product_catalog(price_tier)`;

    // GIN trigram index for fuzzy name matching
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_name_trgm ON product_catalog USING gin (display_name gin_trgm_ops)`;

    // Create anonymised_products table
    await sql`
      CREATE TABLE IF NOT EXISTS anonymised_products (
        id SERIAL PRIMARY KEY,
        product_hash VARCHAR(64) UNIQUE NOT NULL,
        category VARCHAR(100),
        name_clean VARCHAR(500),
        brand_type VARCHAR(50),
        price_tier VARCHAR(50),
        efficacy_signals JSONB DEFAULT '{}',
        ingredient_profile JSONB DEFAULT '{}',
        market_signals JSONB DEFAULT '{}',
        acquisition_lead VARCHAR(64),
        last_updated TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_anon_hash ON anonymised_products(product_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier)`;

    // Create product_enrichment table for Shopify <-> catalog matching
    await sql`
      CREATE TABLE IF NOT EXISTS product_enrichment (
        id SERIAL PRIMARY KEY,
        shopify_product_id TEXT NOT NULL,
        shopify_title TEXT NOT NULL,
        shopify_vendor TEXT,
        shopify_product_type TEXT,
        shopify_price NUMERIC(10,2),
        shopify_handle TEXT,
        catalog_product_hash VARCHAR(64),
        catalog_display_name TEXT,
        match_method VARCHAR(50) NOT NULL DEFAULT 'fuzzy',
        similarity_score NUMERIC(5,4) DEFAULT 0,
        confidence VARCHAR(20) DEFAULT 'low',
        match_reasons TEXT[],
        efficacy_score NUMERIC(4,2),
        key_actives TEXT[],
        suitable_for TEXT[],
        contraindications TEXT[],
        ingredient_summary JSONB DEFAULT '{}',
        competitor_price_avg NUMERIC(10,2),
        price_position VARCHAR(20),
        margin_opportunity NUMERIC(5,2),
        status VARCHAR(20) DEFAULT 'pending',
        reviewed_at TIMESTAMPTZ,
        applied_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(shopify_product_id, catalog_product_hash)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_enrich_shopify_id ON product_enrichment(shopify_product_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrich_catalog_hash ON product_enrichment(catalog_product_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrich_confidence ON product_enrichment(confidence)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrich_status ON product_enrichment(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_enrich_similarity ON product_enrichment(similarity_score DESC)`;

    // Market benchmarks aggregate table
    await sql`
      CREATE TABLE IF NOT EXISTS market_benchmarks (
        id SERIAL PRIMARY KEY,
        product_type VARCHAR(50) NOT NULL,
        price_tier VARCHAR(50) NOT NULL,
        avg_efficacy NUMERIC(4,2),
        avg_price NUMERIC(10,2),
        product_count INTEGER DEFAULT 0,
        top_actives TEXT[],
        top_concerns TEXT[],
        computed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(product_type, price_tier)
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_bench_type ON market_benchmarks(product_type)`;

    // Check all table statuses
    const [catalogCount] = await sql`SELECT COUNT(*) as count FROM product_catalog`;
    const [anonCount] = await sql`SELECT COUNT(*) as count FROM anonymised_products`;
    const [enrichCount] = await sql`SELECT COUNT(*) as count FROM product_enrichment`;
    const [benchCount] = await sql`SELECT COUNT(*) as count FROM market_benchmarks`;

    return NextResponse.json({
      status: "success",
      tables: {
        product_catalog: { exists: true, rows: parseInt(catalogCount.count) },
        anonymised_products: { exists: true, rows: parseInt(anonCount.count) },
        product_enrichment: { exists: true, rows: parseInt(enrichCount.count) },
        market_benchmarks: { exists: true, rows: parseInt(benchCount.count) },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
