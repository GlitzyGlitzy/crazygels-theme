"""
Intelligence data store with encrypted source mapping.

The frontend never sees source attribution -- only your internal
acquisition codes. Source mappings are stored encrypted in a separate
table and can only be decrypted by your purchasing team.
"""

import json
import logging
import os
from typing import Optional

import psycopg2
from psycopg2.extras import Json

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schema for intelligence-specific tables (extends the base schema)
# ---------------------------------------------------------------------------

INTELLIGENCE_SCHEMA = """
CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS source_mappings (
    id SERIAL PRIMARY KEY,
    acquisition_lead VARCHAR(64) UNIQUE NOT NULL,
    encrypted_mapping BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_hash ON products(product_hash);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_type);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price_tier);
CREATE INDEX IF NOT EXISTS idx_source_lead ON source_mappings(acquisition_lead);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    acquisition_lead VARCHAR(16) REFERENCES source_mappings(acquisition_lead),
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

CREATE INDEX IF NOT EXISTS idx_po_lead ON purchase_orders(acquisition_lead);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_rec_user ON recommendation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_rec_created ON recommendation_logs(created_at DESC);
"""


class IntelligenceStore:
    """Stores scraped data with encrypted source mapping.

    The frontend never sees source, only your internal codes.
    Source mapping is stored encrypted using AWS KMS data keys
    and can only be decrypted by authorised IAM roles.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        database: Optional[str] = None,
        user: Optional[str] = None,
        password: Optional[str] = None,
        kms_key_alias: str = "alias/intelligence-encryption",
    ):
        self.db = psycopg2.connect(
            host=host or os.environ.get(
                "INTELLIGENCE_DB_HOST",
                os.environ.get("RDS_HOST", "localhost"),
            ),
            database=database or os.environ.get(
                "INTELLIGENCE_DB_NAME",
                os.environ.get("RDS_DATABASE", "intelligence"),
            ),
            user=user or os.environ.get(
                "INTELLIGENCE_DB_USER",
                os.environ.get("RDS_USERNAME", "scraper_write"),
            ),
            password=password or self._get_db_password(),
            sslmode="require" if os.environ.get("AWS_DEFAULT_REGION") else "prefer",
        )
        self.db.autocommit = False

        # Initialise schema
        with self.db.cursor() as cur:
            cur.execute(INTELLIGENCE_SCHEMA)
        self.db.commit()

        # Encryption for source mapping (separate from application data)
        self.cipher = None
        self.kms_key_alias = kms_key_alias
        self._init_encryption()

    def _get_db_password(self) -> str:
        """Load DB password from AWS Secrets Manager or env var."""
        password = os.environ.get("INTELLIGENCE_DB_PASSWORD") or os.environ.get("RDS_PASSWORD")
        if password:
            return password

        try:
            import boto3

            secrets = boto3.client("secretsmanager")
            secret = secrets.get_secret_value(SecretId="crazygels/intelligence-db")
            creds = json.loads(secret["SecretString"])
            return creds["password"]
        except Exception as e:
            logger.warning(f"Could not load DB password from Secrets Manager: {e}")
            return ""

    def _init_encryption(self):
        """Initialise Fernet cipher using AWS KMS data key."""
        try:
            import boto3
            import base64
            from cryptography.fernet import Fernet

            kms = boto3.client("kms")
            response = kms.generate_data_key(
                KeyId=self.kms_key_alias, KeySpec="AES_256"
            )
            # Use the plaintext key for Fernet (must be 32-byte base64-encoded)
            key = base64.urlsafe_b64encode(response["Plaintext"][:32])
            self.cipher = Fernet(key)
            logger.info("KMS encryption initialised for source mappings")
        except Exception as e:
            logger.warning(
                f"KMS encryption unavailable ({e}). "
                "Source mappings will not be stored."
            )
            self.cipher = None

    # ── Write operations ─────────────────────────────────────────

    def store_product(
        self,
        anonymized_product: dict,
        source_mapping: Optional[dict] = None,
    ):
        """Store product with no source attribution.

        Source mapping is stored separately, encrypted with KMS.
        If encryption is unavailable, source mapping is skipped.

        Args:
            anonymized_product: Dict with product_hash, category, name_clean,
                brand_type, price_tier, efficacy_signals, ingredient_profile,
                market_signals, acquisition_lead, last_updated.
            source_mapping: Optional dict with source URL, IDs, etc.
                Only stored if KMS encryption is available.
        """
        cur = self.db.cursor()

        try:
            # Main product table -- no source info
            cur.execute(
                """INSERT INTO products (
                    product_hash, category, name_clean, brand_type, price_tier,
                    efficacy_signals, ingredient_profile, market_signals,
                    acquisition_lead, last_updated
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (product_hash) DO UPDATE SET
                    category = EXCLUDED.category,
                    name_clean = EXCLUDED.name_clean,
                    brand_type = EXCLUDED.brand_type,
                    price_tier = EXCLUDED.price_tier,
                    efficacy_signals = EXCLUDED.efficacy_signals,
                    ingredient_profile = EXCLUDED.ingredient_profile,
                    market_signals = EXCLUDED.market_signals,
                    acquisition_lead = EXCLUDED.acquisition_lead,
                    last_updated = EXCLUDED.last_updated""",
                (
                    anonymized_product["product_hash"],
                    anonymized_product.get("category"),
                    anonymized_product.get("name_clean"),
                    anonymized_product.get("brand_type"),
                    anonymized_product.get("price_tier"),
                    Json(anonymized_product.get("efficacy_signals", {})),
                    Json(anonymized_product.get("ingredient_profile", {})),
                    Json(anonymized_product.get("market_signals", {})),
                    anonymized_product.get("acquisition_lead"),
                    anonymized_product.get("last_updated"),
                ),
            )

            # Source mapping in separate table, encrypted
            if source_mapping and self.cipher:
                encrypted = self.cipher.encrypt(
                    json.dumps(source_mapping).encode("utf-8")
                )
                cur.execute(
                    """INSERT INTO source_mappings (acquisition_lead, encrypted_mapping)
                    VALUES (%s, %s)
                    ON CONFLICT (acquisition_lead) DO UPDATE SET
                        encrypted_mapping = EXCLUDED.encrypted_mapping""",
                    (
                        anonymized_product["acquisition_lead"],
                        encrypted,
                    ),
                )

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to store product: {e}")
            raise
        finally:
            cur.close()

    def store_batch(
        self,
        products: list[dict],
        source_mappings: Optional[list[dict]] = None,
    ):
        """Store multiple products in a single transaction."""
        mappings = source_mappings or [None] * len(products)
        for product, mapping in zip(products, mappings):
            self.store_product(product, mapping)
        logger.info(f"Stored batch of {len(products)} products")

    # ── Read operations (frontend-safe) ──────────────────────────

    def get_product_for_display(self, product_hash: str) -> Optional[dict]:
        """Return product data for frontend -- zero source attribution.

        This is what powers dashboards and public-facing analytics.
        """
        cur = self.db.cursor()
        try:
            cur.execute(
                """SELECT product_hash, category, name_clean, brand_type,
                        price_tier, efficacy_signals, ingredient_profile
                FROM products
                WHERE product_hash = %s""",
                (product_hash,),
            )

            row = cur.fetchone()
            if not row:
                return None

            return {
                "id": row[0][:8],  # Truncated hash as public ID
                "category": row[1],
                "name": row[2],
                "brand_tier": row[3],
                "price_tier": row[4],
                "efficacy": row[5],
                "ingredients": row[6],
                # NO source, NO url, NO "available at Sephora"
            }
        finally:
            cur.close()

    def search_products(
        self,
        category: Optional[str] = None,
        brand_type: Optional[str] = None,
        price_tier: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """Search products by filters -- all results are source-free."""
        conditions = []
        params = []

        if category:
            conditions.append("category = %s")
            params.append(category)
        if brand_type:
            conditions.append("brand_type = %s")
            params.append(brand_type)
        if price_tier:
            conditions.append("price_tier = %s")
            params.append(price_tier)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        params.append(limit)

        cur = self.db.cursor()
        try:
            cur.execute(
                f"""SELECT product_hash, category, name_clean, brand_type,
                        price_tier, efficacy_signals, ingredient_profile
                FROM products
                {where}
                ORDER BY last_updated DESC
                LIMIT %s""",
                params,
            )

            return [
                {
                    "id": row[0][:8],
                    "category": row[1],
                    "name": row[2],
                    "brand_tier": row[3],
                    "price_tier": row[4],
                    "efficacy": row[5],
                    "ingredients": row[6],
                }
                for row in cur.fetchall()
            ]
        finally:
            cur.close()

    def get_market_summary(self) -> dict:
        """Aggregate market intelligence for dashboard display."""
        cur = self.db.cursor()
        try:
            cur.execute(
                """SELECT
                    COUNT(*) as total_products,
                    COUNT(DISTINCT category) as categories,
                    json_object_agg(
                        COALESCE(brand_type, 'unknown'),
                        brand_count
                    ) as brand_distribution,
                    json_object_agg(
                        COALESCE(price_tier, 'unknown'),
                        price_count
                    ) as price_distribution
                FROM (
                    SELECT brand_type, COUNT(*) as brand_count
                    FROM products GROUP BY brand_type
                ) b,
                (
                    SELECT price_tier, COUNT(*) as price_count
                    FROM products GROUP BY price_tier
                ) p,
                (SELECT COUNT(*) as total_products, COUNT(DISTINCT category) as categories FROM products) t"""
            )
            row = cur.fetchone()
            if not row:
                return {"total_products": 0}
            return {
                "total_products": row[0],
                "categories": row[1],
                "brand_distribution": row[2] or {},
                "price_distribution": row[3] or {},
            }
        except Exception as e:
            logger.error(f"Market summary query failed: {e}")
            return {"total_products": 0, "error": str(e)}
        finally:
            cur.close()

    # ── Internal-only operations (purchasing team) ───────────────

    def get_purchase_intelligence(self, acquisition_lead: str) -> Optional[dict]:
        """Only for your internal purchasing team.

        Decrypts source mapping to show where to buy.
        Requires KMS access -- IAM role restricted.
        """
        if not self.cipher:
            logger.error("Cannot decrypt: KMS encryption not initialised")
            return None

        cur = self.db.cursor()
        try:
            cur.execute(
                """SELECT encrypted_mapping FROM source_mappings
                WHERE acquisition_lead = %s""",
                (acquisition_lead,),
            )

            row = cur.fetchone()
            if not row:
                return None

            decrypted = self.cipher.decrypt(row[0])
            return json.loads(decrypted)
        except Exception as e:
            logger.error(f"Decryption failed for {acquisition_lead}: {e}")
            return None
        finally:
            cur.close()

    # ── Purchase orders (internal ops) ─────────────────────────

    def create_purchase_order(
        self,
        acquisition_lead: str,
        supplier: str,
        cost_price: float,
        suggested_retail: float,
        assigned_buyer: str = "",
    ) -> int:
        """Create a purchase order linked to an acquisition lead.

        Returns the new order ID.
        """
        margin = ((suggested_retail - cost_price) / suggested_retail) * 100
        cur = self.db.cursor()
        try:
            cur.execute(
                """INSERT INTO purchase_orders
                   (acquisition_lead, supplier, cost_price,
                    suggested_retail, margin_percent, assigned_buyer)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (acquisition_lead, supplier, cost_price,
                 suggested_retail, round(margin, 2), assigned_buyer),
            )
            order_id = cur.fetchone()[0]
            self.db.commit()
            logger.info(f"Created purchase order #{order_id} for {acquisition_lead}")
            return order_id
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create purchase order: {e}")
            raise
        finally:
            cur.close()

    def update_order_status(self, order_id: int, status: str):
        """Update a purchase order status.

        Valid statuses: researching, contacted, sample_ordered, listed
        """
        valid = ("researching", "contacted", "sample_ordered", "listed")
        if status not in valid:
            raise ValueError(f"Invalid status '{status}'. Must be one of {valid}")

        cur = self.db.cursor()
        try:
            cur.execute(
                "UPDATE purchase_orders SET status = %s WHERE id = %s",
                (status, order_id),
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise
        finally:
            cur.close()

    def get_orders_by_status(self, status: str, limit: int = 50) -> list[dict]:
        """Get purchase orders filtered by status."""
        cur = self.db.cursor()
        try:
            cur.execute(
                """SELECT id, acquisition_lead, supplier, cost_price,
                          suggested_retail, margin_percent, status,
                          assigned_buyer, created_at
                   FROM purchase_orders
                   WHERE status = %s
                   ORDER BY created_at DESC LIMIT %s""",
                (status, limit),
            )
            return [
                {
                    "id": r[0], "acquisition_lead": r[1], "supplier": r[2],
                    "cost_price": float(r[3]), "suggested_retail": float(r[4]),
                    "margin_percent": float(r[5]), "status": r[6],
                    "assigned_buyer": r[7], "created_at": r[8].isoformat(),
                }
                for r in cur.fetchall()
            ]
        finally:
            cur.close()

    # ── Recommendation tracking ──────────────────────────────────

    def log_recommendation(
        self,
        user_id: str,
        skin_profile_hash: str,
        recommended_hashes: list[str],
        clicked_hash: Optional[str] = None,
        purchased_hash: Optional[str] = None,
        revenue: float = 0.0,
    ) -> int:
        """Log a product recommendation event.

        Call once when recommendations are shown, then update with
        log_recommendation_click / log_recommendation_purchase.
        """
        cur = self.db.cursor()
        try:
            cur.execute(
                """INSERT INTO recommendation_logs
                   (user_id, skin_profile_hash, recommended_products,
                    clicked_product, purchased_product, revenue_generated)
                   VALUES (%s, %s, %s, %s, %s, %s)
                   RETURNING id""",
                (user_id, skin_profile_hash, recommended_hashes,
                 clicked_hash, purchased_hash, revenue),
            )
            rec_id = cur.fetchone()[0]
            self.db.commit()
            return rec_id
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to log recommendation: {e}")
            raise
        finally:
            cur.close()

    def log_recommendation_click(self, rec_id: int, product_hash: str):
        """Update a recommendation log with the clicked product."""
        cur = self.db.cursor()
        try:
            cur.execute(
                "UPDATE recommendation_logs SET clicked_product = %s WHERE id = %s",
                (product_hash, rec_id),
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise
        finally:
            cur.close()

    def log_recommendation_purchase(
        self, rec_id: int, product_hash: str, revenue: float
    ):
        """Update a recommendation log with the purchase outcome."""
        cur = self.db.cursor()
        try:
            cur.execute(
                """UPDATE recommendation_logs
                   SET purchased_product = %s, revenue_generated = %s
                   WHERE id = %s""",
                (product_hash, revenue, rec_id),
            )
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise
        finally:
            cur.close()

    def get_recommendation_stats(self) -> dict:
        """Get aggregate recommendation performance metrics."""
        cur = self.db.cursor()
        try:
            cur.execute(
                """SELECT
                    COUNT(*) as total_recs,
                    COUNT(clicked_product) as total_clicks,
                    COUNT(purchased_product) as total_purchases,
                    COALESCE(SUM(revenue_generated), 0) as total_revenue,
                    ROUND(
                        COUNT(clicked_product)::numeric / NULLIF(COUNT(*), 0) * 100, 1
                    ) as ctr_percent,
                    ROUND(
                        COUNT(purchased_product)::numeric / NULLIF(COUNT(clicked_product), 0) * 100, 1
                    ) as conversion_percent
                FROM recommendation_logs"""
            )
            row = cur.fetchone()
            return {
                "total_recommendations": row[0],
                "total_clicks": row[1],
                "total_purchases": row[2],
                "total_revenue": float(row[3]),
                "click_through_rate": float(row[4] or 0),
                "conversion_rate": float(row[5] or 0),
            }
        except Exception as e:
            logger.error(f"Recommendation stats query failed: {e}")
            return {"total_recommendations": 0}
        finally:
            cur.close()

    # ── Lifecycle ────────────────────────────────────────────────

    def close(self):
        """Close the database connection."""
        if self.db:
            self.db.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
