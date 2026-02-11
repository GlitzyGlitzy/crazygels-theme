"""Storage backends for scraped data: local SQLite and AWS RDS PostgreSQL."""

import json
import logging
import os
import sqlite3
from datetime import datetime
from typing import Optional

from scrapers.common.models import Product, PricePoint, ScraperResult

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# SQL schemas
# ---------------------------------------------------------------------------

SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    rating REAL,
    review_count INTEGER,
    ingredients TEXT,
    size TEXT,
    sku TEXT,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, external_id)
);

CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    price REAL NOT NULL,
    currency TEXT DEFAULT 'EUR',
    sale_price REAL,
    in_stock BOOLEAN DEFAULT 1,
    scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS scrape_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    started_at TIMESTAMP NOT NULL,
    finished_at TIMESTAMP NOT NULL,
    product_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    total_pages INTEGER DEFAULT 0,
    errors TEXT
);

CREATE TABLE IF NOT EXISTS anonymised_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_hash TEXT UNIQUE NOT NULL,
    category TEXT,
    name_clean TEXT,
    brand_type TEXT,
    price_tier TEXT,
    efficacy_signals TEXT,
    ingredient_profile TEXT,
    market_signals TEXT,
    acquisition_lead TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped ON price_history(scraped_at);
CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category);
CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type);
CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier);
"""

POSTGRES_SCHEMA = """
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
    product_id INTEGER NOT NULL REFERENCES products(id),
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

CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_scraped ON price_history(scraped_at);
CREATE INDEX IF NOT EXISTS idx_anon_category ON anonymised_products(category);
CREATE INDEX IF NOT EXISTS idx_anon_brand ON anonymised_products(brand_type);
CREATE INDEX IF NOT EXISTS idx_anon_price ON anonymised_products(price_tier);
"""


class LocalStorage:
    """SQLite storage for local development and testing."""

    def __init__(self, db_path: str = "data/scraper.db"):
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SQLITE_SCHEMA)
        self.conn.commit()
        logger.info(f"Connected to local SQLite: {self.db_path}")

    def close(self):
        if self.conn:
            self.conn.close()

    def save_result(self, result: ScraperResult):
        """Persist a full scraper result (products + price history + run log)."""
        if not self.conn:
            self.connect()

        cursor = self.conn.cursor()

        # Log the scrape run
        cursor.execute(
            """INSERT INTO scrape_runs
               (source, started_at, finished_at, product_count, error_count, total_pages, errors)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                result.source.value,
                result.started_at.isoformat(),
                result.finished_at.isoformat(),
                len(result.products),
                len(result.errors),
                result.total_pages,
                json.dumps(result.errors),
            ),
        )

        for product in result.products:
            # Upsert product
            cursor.execute(
                """INSERT INTO products
                   (source, external_id, name, brand, url, category,
                    image_url, description, rating, review_count,
                    ingredients, size, sku, tags, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON CONFLICT(source, external_id) DO UPDATE SET
                     name=excluded.name, brand=excluded.brand, url=excluded.url,
                     category=excluded.category, image_url=excluded.image_url,
                     description=excluded.description, rating=excluded.rating,
                     review_count=excluded.review_count, ingredients=excluded.ingredients,
                     size=excluded.size, sku=excluded.sku, tags=excluded.tags,
                     updated_at=excluded.updated_at""",
                (
                    product.source.value,
                    product.external_id,
                    product.name,
                    product.brand,
                    product.url,
                    product.category.value,
                    product.image_url,
                    product.description,
                    product.rating,
                    product.review_count,
                    product.ingredients,
                    product.size,
                    product.sku,
                    json.dumps(product.tags),
                    datetime.utcnow().isoformat(),
                ),
            )

            product_id = cursor.execute(
                "SELECT id FROM products WHERE source=? AND external_id=?",
                (product.source.value, product.external_id),
            ).fetchone()[0]

            # Add price history entry
            cursor.execute(
                """INSERT INTO price_history
                   (product_id, price, currency, sale_price, in_stock, scraped_at)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                (
                    product_id,
                    product.price.price,
                    product.price.currency,
                    product.price.sale_price,
                    product.price.in_stock,
                    product.price.scraped_at.isoformat(),
                ),
            )

        self.conn.commit()
        logger.info(
            f"Saved {len(result.products)} products to local SQLite"
        )

    def save_anonymised(self, product: dict):
        """Save an anonymised product dict (from SephoraScraper)."""
        if not self.conn:
            self.connect()

        cursor = self.conn.cursor()
        cursor.execute(
            """INSERT INTO anonymised_products
               (product_hash, category, name_clean, brand_type, price_tier,
                efficacy_signals, ingredient_profile, market_signals,
                acquisition_lead, last_updated)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(product_hash) DO UPDATE SET
                 category=excluded.category, name_clean=excluded.name_clean,
                 brand_type=excluded.brand_type, price_tier=excluded.price_tier,
                 efficacy_signals=excluded.efficacy_signals,
                 ingredient_profile=excluded.ingredient_profile,
                 market_signals=excluded.market_signals,
                 acquisition_lead=excluded.acquisition_lead,
                 last_updated=excluded.last_updated""",
            (
                product["product_hash"],
                product.get("category"),
                product.get("name_clean"),
                product.get("brand_type"),
                product.get("price_tier"),
                json.dumps(product.get("efficacy_signals", {})),
                json.dumps(product.get("ingredient_profile", {})),
                json.dumps(product.get("market_signals", {})),
                product.get("acquisition_lead"),
                product.get("last_updated", datetime.utcnow().isoformat()),
            ),
        )
        self.conn.commit()


class PostgresStorage:
    """RDS PostgreSQL storage for production (AWS)."""

    def __init__(self):
        self.conn = None

    def connect(self):
        try:
            import psycopg2

            self.conn = psycopg2.connect(
                host=os.environ["RDS_HOST"],
                port=int(os.environ.get("RDS_PORT", "5432")),
                dbname=os.environ["RDS_DATABASE"],
                user=os.environ["RDS_USERNAME"],
                password=os.environ["RDS_PASSWORD"],
                sslmode="require",
            )
            with self.conn.cursor() as cur:
                cur.execute(POSTGRES_SCHEMA)
            self.conn.commit()
            logger.info("Connected to RDS PostgreSQL")
        except ImportError:
            raise RuntimeError("psycopg2 is required for PostgresStorage. pip install psycopg2-binary")

    def close(self):
        if self.conn:
            self.conn.close()

    def save_result(self, result: ScraperResult):
        """Persist a full scraper result to RDS PostgreSQL."""
        if not self.conn:
            self.connect()

        with self.conn.cursor() as cur:
            # Log the scrape run
            cur.execute(
                """INSERT INTO scrape_runs
                   (source, started_at, finished_at, product_count, error_count, total_pages, errors)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    result.source.value,
                    result.started_at,
                    result.finished_at,
                    len(result.products),
                    len(result.errors),
                    result.total_pages,
                    json.dumps(result.errors),
                ),
            )

            for product in result.products:
                cur.execute(
                    """INSERT INTO products
                       (source, external_id, name, brand, url, category,
                        image_url, description, rating, review_count,
                        ingredients, size, sku, tags, updated_at)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                       ON CONFLICT(source, external_id) DO UPDATE SET
                         name=EXCLUDED.name, brand=EXCLUDED.brand, url=EXCLUDED.url,
                         category=EXCLUDED.category, image_url=EXCLUDED.image_url,
                         description=EXCLUDED.description, rating=EXCLUDED.rating,
                         review_count=EXCLUDED.review_count, ingredients=EXCLUDED.ingredients,
                         size=EXCLUDED.size, sku=EXCLUDED.sku, tags=EXCLUDED.tags,
                         updated_at=NOW()
                       RETURNING id""",
                    (
                        product.source.value,
                        product.external_id,
                        product.name,
                        product.brand,
                        product.url,
                        product.category.value,
                        product.image_url,
                        product.description,
                        product.rating,
                        product.review_count,
                        product.ingredients,
                        product.size,
                        product.sku,
                        json.dumps(product.tags),
                    ),
                )
                product_id = cur.fetchone()[0]

                cur.execute(
                    """INSERT INTO price_history
                       (product_id, price, currency, sale_price, in_stock, scraped_at)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    (
                        product_id,
                        product.price.price,
                        product.price.currency,
                        product.price.sale_price,
                        product.price.in_stock,
                        product.price.scraped_at,
                    ),
                )

        self.conn.commit()
        logger.info(
            f"Saved {len(result.products)} products to RDS PostgreSQL"
        )

    def save_anonymised(self, product: dict):
        """Save an anonymised product dict (from SephoraScraper)."""
        if not self.conn:
            self.connect()

        with self.conn.cursor() as cur:
            cur.execute(
                """INSERT INTO anonymised_products
                   (product_hash, category, name_clean, brand_type, price_tier,
                    efficacy_signals, ingredient_profile, market_signals,
                    acquisition_lead, last_updated)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                   ON CONFLICT(product_hash) DO UPDATE SET
                     category=EXCLUDED.category, name_clean=EXCLUDED.name_clean,
                     brand_type=EXCLUDED.brand_type, price_tier=EXCLUDED.price_tier,
                     efficacy_signals=EXCLUDED.efficacy_signals,
                     ingredient_profile=EXCLUDED.ingredient_profile,
                     market_signals=EXCLUDED.market_signals,
                     acquisition_lead=EXCLUDED.acquisition_lead,
                     last_updated=NOW()""",
                (
                    product["product_hash"],
                    product.get("category"),
                    product.get("name_clean"),
                    product.get("brand_type"),
                    product.get("price_tier"),
                    json.dumps(product.get("efficacy_signals", {})),
                    json.dumps(product.get("ingredient_profile", {})),
                    json.dumps(product.get("market_signals", {})),
                    product.get("acquisition_lead"),
                ),
            )
        self.conn.commit()
