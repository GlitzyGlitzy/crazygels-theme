-- Add retail_price column to product_catalog for actual competitor prices
ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2);

-- Add currency column (default EUR for this store)
ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR';

-- Add source_url column so we know where the price came from
ALTER TABLE product_catalog ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add an index for price lookups by product_type + price_tier
CREATE INDEX IF NOT EXISTS idx_catalog_price_lookup 
  ON product_catalog (product_type, price_tier) 
  WHERE retail_price IS NOT NULL;

-- Update market_benchmarks avg_price to be recomputed from actual retail_price data
-- (This will be populated by the updated benchmark computation)
