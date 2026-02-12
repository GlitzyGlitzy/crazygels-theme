import { NextResponse } from "next/server";
import sql from "@/lib/db";

/** Helper: run SQL, return null on success or error string on failure */
async function run(query: string): Promise<string | null> {
  try {
    await sql.unsafe(query);
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

export async function POST() {
  const log: string[] = [];

  try {
    // Step 1: Enable pg_trgm extension
    const extErr = await run("CREATE EXTENSION IF NOT EXISTS pg_trgm");
    if (extErr) log.push(`pg_trgm: ${extErr}`);
    else log.push("pg_trgm extension ready");

    // Step 2: Check which tables already exist
    const existingTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    const tableNames = existingTables.map((t: { table_name: string }) => t.table_name);
    log.push(`Existing tables: ${tableNames.join(", ") || "none"}`);

    // Step 3: Check existing columns on product_catalog (if it exists)
    let existingCatalogCols: string[] = [];
    if (tableNames.includes("product_catalog")) {
      const cols = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'product_catalog'
      `;
      existingCatalogCols = cols.map((c: { column_name: string }) => c.column_name);
      log.push(`product_catalog columns: ${existingCatalogCols.join(", ")}`);
    }

    // Step 4: Create product_catalog if it doesn't exist
    if (!tableNames.includes("product_catalog")) {
      const err = await run(`
        CREATE TABLE product_catalog (
          product_hash VARCHAR(64) PRIMARY KEY,
          display_name VARCHAR(500) NOT NULL,
          category VARCHAR(100),
          product_type VARCHAR(50),
          price_tier VARCHAR(50),
          efficacy_score NUMERIC(4,2),
          review_signals VARCHAR(50) DEFAULT 'stable',
          key_actives TEXT[],
          ingredient_summary JSONB DEFAULT '{}'::jsonb,
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
      `);
      if (err) log.push(`CREATE product_catalog: ${err}`);
      else log.push("Created product_catalog table");
    } else {
      log.push("product_catalog already exists, checking columns...");
    }

    // Step 5: Add missing columns to product_catalog
    const requiredCols: [string, string][] = [
      ["source", "VARCHAR(50)"],
      ["status", "VARCHAR(20) DEFAULT 'research'"],
      ["acquisition_lead", "VARCHAR(64)"],
      ["key_actives", "TEXT[]"],
      ["ingredient_summary", "JSONB DEFAULT '{}'::jsonb"],
      ["suitable_for", "TEXT[]"],
      ["contraindications", "TEXT[]"],
      ["image_url", "TEXT"],
      ["description_generated", "TEXT"],
      ["review_signals", "VARCHAR(50) DEFAULT 'stable'"],
      ["efficacy_score", "NUMERIC(4,2)"],
      ["price_tier", "VARCHAR(50)"],
      ["product_type", "VARCHAR(50)"],
      ["updated_at", "TIMESTAMPTZ DEFAULT NOW()"],
      ["created_at", "TIMESTAMPTZ DEFAULT NOW()"],
      ["display_name", "VARCHAR(500)"],
      ["category", "VARCHAR(100)"],
    ];

    // Re-read columns after possible table creation
    const colsNow = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_catalog'
    `;
    const currentCols = new Set(colsNow.map((c: { column_name: string }) => c.column_name));

    for (const [col, def] of requiredCols) {
      if (!currentCols.has(col)) {
        const err = await run(`ALTER TABLE product_catalog ADD COLUMN "${col}" ${def}`);
        if (err) log.push(`ADD COLUMN ${col}: ${err}`);
        else log.push(`Added column: ${col}`);
      }
    }

    // Step 6: Create indexes on product_catalog (only for columns that now exist)
    const indexCols = ["product_hash", "category", "product_type", "status", "source", "price_tier"];
    for (const col of indexCols) {
      await run(`CREATE INDEX IF NOT EXISTS idx_catalog_${col} ON product_catalog("${col}")`);
    }
    // Trigram index for fuzzy matching
    await run(`CREATE INDEX IF NOT EXISTS idx_catalog_name_trgm ON product_catalog USING gin (display_name gin_trgm_ops)`);
    log.push("product_catalog indexes ready");

    // Step 7: Create anonymised_products
    const anonErr = await run(`
      CREATE TABLE IF NOT EXISTS anonymised_products (
        id SERIAL PRIMARY KEY,
        product_hash VARCHAR(64) UNIQUE NOT NULL,
        category VARCHAR(100),
        name_clean VARCHAR(500),
        brand_type VARCHAR(50),
        price_tier VARCHAR(50),
        efficacy_signals JSONB DEFAULT '{}'::jsonb,
        ingredient_profile JSONB DEFAULT '{}'::jsonb,
        market_signals JSONB DEFAULT '{}'::jsonb,
        acquisition_lead VARCHAR(64),
        last_updated TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    if (anonErr) log.push(`anonymised_products: ${anonErr}`);
    else log.push("anonymised_products table ready");

    await run(`CREATE INDEX IF NOT EXISTS idx_anon_hash ON anonymised_products(product_hash)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier)`);

    // Step 8: Create product_enrichment
    const enrichErr = await run(`
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
        ingredient_summary JSONB DEFAULT '{}'::jsonb,
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
    `);
    if (enrichErr) log.push(`product_enrichment: ${enrichErr}`);
    else log.push("product_enrichment table ready");

    await run(`CREATE INDEX IF NOT EXISTS idx_enrich_shopify_id ON product_enrichment(shopify_product_id)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_enrich_catalog_hash ON product_enrichment(catalog_product_hash)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_enrich_confidence ON product_enrichment(confidence)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_enrich_status ON product_enrichment(status)`);
    await run(`CREATE INDEX IF NOT EXISTS idx_enrich_similarity ON product_enrichment(similarity_score DESC)`);

    // Step 9: Create market_benchmarks
    const benchErr = await run(`
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
    `);
    if (benchErr) log.push(`market_benchmarks: ${benchErr}`);
    else log.push("market_benchmarks table ready");

    await run(`CREATE INDEX IF NOT EXISTS idx_bench_type ON market_benchmarks(product_type)`);

    // Step 10: Count rows in all tables
    const counts: Record<string, number> = {};
    for (const tbl of ["product_catalog", "anonymised_products", "product_enrichment", "market_benchmarks"]) {
      try {
        const [row] = await sql.unsafe(`SELECT COUNT(*) as count FROM "${tbl}"`);
        counts[tbl] = parseInt(row.count);
      } catch {
        counts[tbl] = -1;
      }
    }

    return NextResponse.json({
      status: "success",
      log,
      tables: {
        product_catalog: { exists: true, rows: counts.product_catalog },
        anonymised_products: { exists: true, rows: counts.anonymised_products },
        product_enrichment: { exists: true, rows: counts.product_enrichment },
        market_benchmarks: { exists: true, rows: counts.market_benchmarks },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
        log,
      },
      { status: 500 }
    );
  }
}
