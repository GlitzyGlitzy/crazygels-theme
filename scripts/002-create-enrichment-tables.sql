-- 002: Enable pg_trgm for fuzzy matching and create enrichment tables
-- Run AFTER 001-create-product-catalog.sql

-- Enable trigram extension for fuzzy text matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Store Shopify <-> scraped product matches with confidence scores
CREATE TABLE IF NOT EXISTS product_enrichment (
  id SERIAL PRIMARY KEY,

  -- Shopify side
  shopify_product_id TEXT NOT NULL,
  shopify_title TEXT NOT NULL,
  shopify_vendor TEXT,
  shopify_product_type TEXT,
  shopify_price NUMERIC(10,2),
  shopify_handle TEXT,

  -- Matched catalog side
  catalog_product_hash VARCHAR(64) REFERENCES product_catalog(product_hash),
  catalog_display_name TEXT,

  -- Match quality
  match_method VARCHAR(50) NOT NULL DEFAULT 'fuzzy',  -- fuzzy, exact, ingredient, manual
  similarity_score NUMERIC(5,4) DEFAULT 0,            -- 0.0000 to 1.0000
  confidence VARCHAR(20) DEFAULT 'low',               -- high, medium, low
  match_reasons TEXT[],                                -- e.g. {'name:0.85', 'vendor:exact', 'actives:3_shared'}

  -- Enrichment data (denormalized for fast reads)
  efficacy_score NUMERIC(4,2),
  key_actives TEXT[],
  suitable_for TEXT[],
  contraindications TEXT[],
  ingredient_summary JSONB DEFAULT '{}',
  competitor_price_avg NUMERIC(10,2),
  price_position VARCHAR(20),     -- underpriced, fair, overpriced
  margin_opportunity NUMERIC(5,2),

  -- Status
  status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected, applied
  reviewed_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(shopify_product_id, catalog_product_hash)
);

-- Indexes for enrichment lookups
CREATE INDEX IF NOT EXISTS idx_enrich_shopify_id ON product_enrichment(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_enrich_catalog_hash ON product_enrichment(catalog_product_hash);
CREATE INDEX IF NOT EXISTS idx_enrich_confidence ON product_enrichment(confidence);
CREATE INDEX IF NOT EXISTS idx_enrich_status ON product_enrichment(status);
CREATE INDEX IF NOT EXISTS idx_enrich_similarity ON product_enrichment(similarity_score DESC);

-- GIN trigram indexes on product_catalog for fast fuzzy search
CREATE INDEX IF NOT EXISTS idx_catalog_name_trgm ON product_catalog USING gin (display_name gin_trgm_ops);

-- Aggregate table for market intelligence per product type
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
);

CREATE INDEX IF NOT EXISTS idx_bench_type ON market_benchmarks(product_type);
