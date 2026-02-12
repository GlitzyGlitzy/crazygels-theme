import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST() {
  try {
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

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_hash ON product_catalog(product_hash)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_category ON product_catalog(category)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_type ON product_catalog(product_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_status ON product_catalog(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_source ON product_catalog(source)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_catalog_price_tier ON product_catalog(price_tier)`;

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

    // Check table status
    const [catalogCount] = await sql`
      SELECT COUNT(*) as count FROM product_catalog
    `;
    const [anonCount] = await sql`
      SELECT COUNT(*) as count FROM anonymised_products
    `;

    return NextResponse.json({
      status: "success",
      tables: {
        product_catalog: { exists: true, rows: parseInt(catalogCount.count) },
        anonymised_products: { exists: true, rows: parseInt(anonCount.count) },
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
