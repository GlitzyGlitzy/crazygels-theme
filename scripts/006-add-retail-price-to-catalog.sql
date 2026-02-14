-- 006: Add retail_price column to product_catalog
-- The scrapers capture actual prices but only the tier label was stored.
-- This adds the numeric price so enrichment can use real competitor prices.

ALTER TABLE product_catalog
ADD COLUMN IF NOT EXISTS retail_price NUMERIC(10,2);

-- Backfill from price_history where possible:
-- For each product_hash in product_catalog, grab the latest price from price_history
UPDATE product_catalog pc
SET retail_price = ph.price
FROM (
  SELECT DISTINCT ON (p.product_hash)
    p.product_hash,
    ph.price
  FROM price_history ph
  JOIN products p ON p.id = ph.product_id
  WHERE ph.price > 0
  ORDER BY p.product_hash, ph.scraped_at DESC
) ph
WHERE pc.product_hash = ph.product_hash
  AND pc.retail_price IS NULL;

-- For any remaining NULLs, estimate from price_tier
UPDATE product_catalog
SET retail_price = CASE price_tier
  WHEN 'budget' THEN 12.00
  WHEN 'mid' THEN 28.00
  WHEN 'premium' THEN 55.00
  WHEN 'luxury' THEN 120.00
  ELSE NULL
END
WHERE retail_price IS NULL AND price_tier IS NOT NULL;

-- Index for price queries
CREATE INDEX IF NOT EXISTS idx_catalog_retail_price ON product_catalog(retail_price);
