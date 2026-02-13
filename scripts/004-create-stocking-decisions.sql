-- Create stocking_decisions table for the product stocking workflow
CREATE TABLE IF NOT EXISTS stocking_decisions (
  id SERIAL PRIMARY KEY,
  product_hash VARCHAR(255) NOT NULL,
  decision VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected
  retail_price NUMERIC(10,2),
  initial_quantity INTEGER,
  fulfillment_method VARCHAR(50) DEFAULT 'manual',   -- manual, 3pl, dropship
  priority VARCHAR(20) DEFAULT 'medium',             -- high, medium, low
  notes TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by product and decision status
CREATE INDEX IF NOT EXISTS idx_stocking_product_hash ON stocking_decisions(product_hash);
CREATE INDEX IF NOT EXISTS idx_stocking_decision ON stocking_decisions(decision);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_stocking_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_stocking_decisions_updated_at ON stocking_decisions;
CREATE TRIGGER trigger_stocking_decisions_updated_at
  BEFORE UPDATE ON stocking_decisions
  FOR EACH ROW
  EXECUTE FUNCTION update_stocking_decisions_updated_at();
