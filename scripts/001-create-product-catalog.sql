-- Create the product_catalog table used by the scraper pipeline.
-- This table stores promoted products from the intelligence scrapers.

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
);

CREATE INDEX IF NOT EXISTS idx_catalog_hash ON product_catalog(product_hash);
CREATE INDEX IF NOT EXISTS idx_catalog_category ON product_catalog(category);
CREATE INDEX IF NOT EXISTS idx_catalog_type ON product_catalog(product_type);
CREATE INDEX IF NOT EXISTS idx_catalog_status ON product_catalog(status);
CREATE INDEX IF NOT EXISTS idx_catalog_source ON product_catalog(source);
CREATE INDEX IF NOT EXISTS idx_catalog_price_tier ON product_catalog(price_tier);

-- Also create the anonymised_products table (used by run_all.py --postgres)
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
);

CREATE INDEX IF NOT EXISTS idx_anon_hash ON anonymised_products(product_hash);
CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category);
CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type);
CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier);
