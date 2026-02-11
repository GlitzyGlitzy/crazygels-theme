-- Migration 001: Initial Schema
-- Sets up extensions, base scraper tables, intelligence tables,
-- and utility functions required by all downstream migrations.
--
-- Target: RDS PostgreSQL 15+
-- Database: crazygels
-- Run BEFORE 002_product_catalog.sql

-- ── EXTENSIONS ──────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── SCRAPER BASE TABLES ─────────────────────────────────────────
-- These tables are the raw landing zone for all scrapers
-- (storage.py PostgresStorage). Data flows:
--   scraper -> products/price_history -> anonymised_products
--                                     -> 002 product_catalog (curated)

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(500) NOT NULL,
    brand VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    description TEXT,
    rating NUMERIC(3,2),
    review_count INTEGER,
    ingredients TEXT,
    size VARCHAR(100),
    sku VARCHAR(255),
    tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source, external_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    price NUMERIC(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    sale_price NUMERIC(10,2),
    in_stock BOOLEAN DEFAULT TRUE,
    scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL,
    product_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'
);

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

-- ── INTELLIGENCE TABLES ─────────────────────────────────────────
-- Used by data_store.py IntelligenceStore for encrypted source
-- mapping, purchase orders, and recommendation tracking.

CREATE TABLE IF NOT EXISTS source_mappings (
    id SERIAL PRIMARY KEY,
    acquisition_lead VARCHAR(64) UNIQUE NOT NULL,
    encrypted_mapping BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    acquisition_lead VARCHAR(64) REFERENCES source_mappings(acquisition_lead),
    supplier VARCHAR(50),
    cost_price DECIMAL(10,2),
    suggested_retail DECIMAL(10,2),
    margin_percent DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'researching',
    assigned_buyer VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100),
    skin_profile_hash VARCHAR(64),
    recommended_products VARCHAR(64)[],
    clicked_product VARCHAR(64),
    purchased_product VARCHAR(64),
    revenue_generated DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────────

-- products (scraper raw data)
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_external ON products(source, external_id);

-- price_history
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped ON price_history(scraped_at);

-- anonymised_products
CREATE INDEX IF NOT EXISTS idx_anon_hash ON anonymised_products(product_hash);
CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category);
CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type);
CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier);

-- source_mappings
CREATE INDEX IF NOT EXISTS idx_source_lead ON source_mappings(acquisition_lead);

-- purchase_orders
CREATE INDEX IF NOT EXISTS idx_po_lead ON purchase_orders(acquisition_lead);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);

-- recommendation_logs
CREATE INDEX IF NOT EXISTS idx_rec_user ON recommendation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_created ON recommendation_logs(created_at DESC);

-- ── UTILITY FUNCTIONS ───────────────────────────────────────────
-- Shared updated_at trigger used by this migration and 002+.

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-update timestamps on scraper base tables
DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS anon_products_updated_at ON anonymised_products;
CREATE TRIGGER anon_products_updated_at
    BEFORE UPDATE ON anonymised_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── MIGRATION TRACKING ──────────────────────────────────────────
-- Simple migration log so we know which scripts have run.

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(50) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Initial schema: scraper tables, intelligence tables, indexes, triggers')
ON CONFLICT (version) DO NOTHING;
