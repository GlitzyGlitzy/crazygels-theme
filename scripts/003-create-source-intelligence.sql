-- 003: Create source_intelligence table
-- This table was defined in deployment/migrations/002_product_catalog.sql
-- but never executed against the live database.

CREATE TABLE IF NOT EXISTS source_intelligence (
    acquisition_lead VARCHAR(32) PRIMARY KEY,
    product_hash    VARCHAR(64) REFERENCES product_catalog(product_hash) ON DELETE SET NULL,

    -- AES-256 encrypted blob (decrypted via KMS at runtime)
    encrypted_source_mapping BYTEA,

    -- Operational data (purchasing team only)
    supplier_contacts JSONB DEFAULT '{}'::jsonb,
    wholesale_price DECIMAL(10,2),
    moq             INTEGER,
    lead_time_days  INTEGER,

    -- Tracking pipeline
    sample_ordered  BOOLEAN DEFAULT FALSE,
    sample_status   VARCHAR(20),
    listed_on_shopify BOOLEAN DEFAULT FALSE,
    shopify_product_id VARCHAR(50),

    last_purchased  TIMESTAMPTZ,
    margin_actual   DECIMAL(5,2),

    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_source_product ON source_intelligence(product_hash);
CREATE INDEX IF NOT EXISTS idx_source_status ON source_intelligence(sample_status);
CREATE INDEX IF NOT EXISTS idx_source_shopify ON source_intelligence(listed_on_shopify);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS source_updated_at ON source_intelligence;
CREATE TRIGGER source_updated_at
    BEFORE UPDATE ON source_intelligence
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
