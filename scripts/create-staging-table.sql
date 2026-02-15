-- Staging table: holds ALL raw scraped data before promotion to catalog
-- This preserves prices, images, URLs, descriptions that were previously lost

CREATE TABLE IF NOT EXISTS scrape_staging (
  id SERIAL PRIMARY KEY,
  product_hash VARCHAR(64) UNIQUE NOT NULL,
  source VARCHAR(50) NOT NULL,            -- ulta, sephora, amazon, open_beauty_facts
  external_id VARCHAR(255),               -- source-specific product ID
  
  -- Product identity
  name VARCHAR(500) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(100),
  product_type VARCHAR(100),
  
  -- Pricing (original currency from source)
  price_original DECIMAL(10,2),
  price_currency VARCHAR(3) DEFAULT 'USD',
  sale_price DECIMAL(10,2),
  price_eur DECIMAL(10,2),                -- converted to EUR
  price_tier VARCHAR(50),
  
  -- Media
  image_url TEXT,
  source_url TEXT,                         -- original product page URL
  
  -- Content
  description TEXT,
  ingredients TEXT,
  size VARCHAR(100),
  
  -- Ratings
  rating DECIMAL(3,1),
  review_count INTEGER,
  
  -- Intelligence signals (preserved from anonymisation)
  efficacy_signals JSONB DEFAULT '{}',
  ingredient_profile JSONB DEFAULT '{}',
  market_signals JSONB DEFAULT '{}',
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'staged',     -- staged, promoted, rejected, duplicate
  promoted_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_staging_source ON scrape_staging(source);
CREATE INDEX IF NOT EXISTS idx_staging_status ON scrape_staging(status);
CREATE INDEX IF NOT EXISTS idx_staging_brand ON scrape_staging(brand);
CREATE INDEX IF NOT EXISTS idx_staging_category ON scrape_staging(category);
CREATE INDEX IF NOT EXISTS idx_staging_hash ON scrape_staging(product_hash);

-- Also add missing columns to product_catalog if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_catalog' AND column_name='source_url') THEN
    ALTER TABLE product_catalog ADD COLUMN source_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_catalog' AND column_name='brand') THEN
    ALTER TABLE product_catalog ADD COLUMN brand VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_catalog' AND column_name='price_original') THEN
    ALTER TABLE product_catalog ADD COLUMN price_original DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_catalog' AND column_name='price_currency') THEN
    ALTER TABLE product_catalog ADD COLUMN price_currency VARCHAR(3) DEFAULT 'EUR';
  END IF;
END $$;
