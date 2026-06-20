-- 008: Recommendation readiness hardening
-- Keeps scraped OBF rows internal until enrichment is complete and reviewed.
-- Public recommendations still require status sampled/listed at query time.

COMMENT ON COLUMN product_catalog.status IS
  'Pipeline status: research=internal scrape, reviewed=enriched/approved, sampled=sample ordered/testing, listed=live/public, delisted=removed';

-- OBF rows without required recommendation metadata must remain internal research.
UPDATE product_catalog
SET status = 'research',
    updated_at = NOW()
WHERE LOWER(REGEXP_REPLACE(COALESCE(source, ''), '[^a-z0-9]', '', 'g')) IN ('openbeautyfacts', 'obf')
  AND status IN ('reviewed', 'sampled')
  AND (
    COALESCE(array_length(key_actives, 1), 0) = 0
    OR COALESCE(array_length(suitable_for, 1), 0) = 0
    OR contraindications IS NULL
  );

-- Non-OBF research rows with complete recommendation metadata can enter review.
UPDATE product_catalog
SET status = 'reviewed',
    updated_at = NOW()
WHERE status = 'research'
  AND LOWER(REGEXP_REPLACE(COALESCE(source, ''), '[^a-z0-9]', '', 'g')) NOT IN ('openbeautyfacts', 'obf')
  AND COALESCE(array_length(key_actives, 1), 0) > 0
  AND COALESCE(array_length(suitable_for, 1), 0) > 0
  AND contraindications IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalog_public_ready
  ON product_catalog (status, product_type, price_tier)
  WHERE status IN ('sampled', 'listed')
    AND COALESCE(array_length(key_actives, 1), 0) > 0
    AND COALESCE(array_length(suitable_for, 1), 0) > 0
    AND contraindications IS NOT NULL;
