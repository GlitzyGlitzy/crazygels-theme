-- Add unique constraint on product_hash for ON CONFLICT upsert support
-- Drop the existing non-unique index first, then create a unique one
DROP INDEX IF EXISTS idx_stocking_product_hash;
ALTER TABLE stocking_decisions ADD CONSTRAINT uq_stocking_product_hash UNIQUE (product_hash);
