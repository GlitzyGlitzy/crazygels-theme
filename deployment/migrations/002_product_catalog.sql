-- Migration 002: Product Catalog + Source Intelligence
-- Adds the public-facing product_catalog table (for recommendation engine)
-- and the encrypted source_intelligence table (for purchasing operations).
-- Run AFTER 001_initial_schema.sql

-- ── PUBLIC TABLE: What the app queries ──────────────────────────
CREATE TABLE IF NOT EXISTS product_catalog (
    product_hash    VARCHAR(64) PRIMARY KEY,
    display_name    VARCHAR(255) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    product_type    VARCHAR(50),                -- 'serum', 'moisturizer', 'cleanser'
    price_tier      VARCHAR(20),                -- 'budget', 'mid', 'premium', 'luxury'

    -- Efficacy (derived from scraped reviews)
    efficacy_score  DECIMAL(3,2),               -- 0.00 to 5.00
    review_signals  VARCHAR(20) DEFAULT 'stable', -- 'trending', 'stable', 'declining'

    -- Ingredients (parsed from raw data)
    key_actives     VARCHAR(100)[],             -- ['niacinamide', 'vitamin_c', 'retinol']
    ingredient_summary JSONB DEFAULT '{}'::jsonb, -- {humectants: 3, emollients: 2, actives: 4}

    -- Matching (for recommendation engine skin-profile queries)
    suitable_for    VARCHAR(50)[],              -- ['acne', 'aging', 'dehydration']
    contraindications VARCHAR(50)[],            -- ['fungal_acne', 'pregnancy']

    -- Display
    image_url       TEXT,
    description_generated TEXT,                 -- Our copy, no source attribution

    -- Pipeline status
    status          VARCHAR(20) DEFAULT 'research',
                    -- 'research'  = scraped, not yet sampled
                    -- 'sampled'   = sample ordered, being tested
                    -- 'listed'    = live on Shopify
                    -- 'delisted'  = removed from store

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INTERNAL TABLE: Encrypted, never exposed to frontend ────────
CREATE TABLE IF NOT EXISTS source_intelligence (
    acquisition_lead VARCHAR(32) PRIMARY KEY,
    product_hash    VARCHAR(64) REFERENCES product_catalog(product_hash) ON DELETE SET NULL,

    -- AES-256 encrypted blob (decrypted via KMS at runtime)
    encrypted_source_mapping BYTEA,

    -- Operational data (purchasing team only)
    supplier_contacts JSONB DEFAULT '{}'::jsonb,  -- {primary: '...', backup: '...'}
    wholesale_price DECIMAL(10,2),
    moq             INTEGER,                      -- Minimum order quantity
    lead_time_days  INTEGER,

    -- Tracking pipeline
    sample_ordered  BOOLEAN DEFAULT FALSE,
    sample_status   VARCHAR(20),                  -- 'pending', 'approved', 'rejected'
    listed_on_shopify BOOLEAN DEFAULT FALSE,
    shopify_product_id VARCHAR(50),

    last_purchased  TIMESTAMPTZ,
    margin_actual   DECIMAL(5,2),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES for fast recommendation queries ─────────────────────
CREATE INDEX IF NOT EXISTS idx_catalog_category ON product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_catalog_type ON product_catalog(product_type);
CREATE INDEX IF NOT EXISTS idx_catalog_actives ON product_catalog USING GIN(key_actives);
CREATE INDEX IF NOT EXISTS idx_catalog_suitable ON product_catalog USING GIN(suitable_for);
CREATE INDEX IF NOT EXISTS idx_catalog_contra ON product_catalog USING GIN(contraindications);
CREATE INDEX IF NOT EXISTS idx_catalog_status ON product_catalog(status);
CREATE INDEX IF NOT EXISTS idx_catalog_efficacy ON product_catalog(efficacy_score DESC);
CREATE INDEX IF NOT EXISTS idx_catalog_price ON product_catalog(price_tier);
CREATE INDEX IF NOT EXISTS idx_source_product ON source_intelligence(product_hash);
CREATE INDEX IF NOT EXISTS idx_source_status ON source_intelligence(sample_status);
CREATE INDEX IF NOT EXISTS idx_source_shopify ON source_intelligence(listed_on_shopify);

-- ── Updated-at trigger ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS catalog_updated_at ON product_catalog;
CREATE TRIGGER catalog_updated_at
    BEFORE UPDATE ON product_catalog
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS source_updated_at ON source_intelligence;
CREATE TRIGGER source_updated_at
    BEFORE UPDATE ON source_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
