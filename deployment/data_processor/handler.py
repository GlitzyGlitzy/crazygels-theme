"""
Lambda: Data Processor
Triggered by S3 put events on crazygels-raw-data bucket OR daily CloudWatch cron.

Flow:
  1. Read raw JSON from S3 (uploaded by scrapers)
  2. Upsert into products + price_history tables
  3. Generate anonymised_products records
  4. Detect price alerts (>15% swings)
  5. Log scrape run metadata

Environment:
  DB_SECRET_ARN  - Secrets Manager ARN for RDS credentials
  RAW_BUCKET     - S3 bucket name for raw data
  EXPORT_BUCKET  - S3 bucket name for exports
"""

import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta
from decimal import Decimal

import boto3
import psycopg2
from psycopg2.extras import execute_values

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ── Config ──────────────────────────────────────────────────────
DB_SECRET_ARN = os.environ["DB_SECRET_ARN"]
RAW_BUCKET = os.environ["RAW_BUCKET"]
EXPORT_BUCKET = os.environ.get("EXPORT_BUCKET", "")

PRICE_ALERT_THRESHOLD = 0.15  # 15% swing triggers alert

LUXURY_BRANDS = {
    "la mer", "sk-ii", "la prairie", "sisley", "tom ford", "chanel",
    "dior", "guerlain", "estee lauder", "lancome", "cle de peau",
}
MASSTIGE_BRANDS = {
    "clinique", "origins", "kiehl's", "drunk elephant", "tatcha",
    "sunday riley", "fresh", "laneige", "olay", "neutrogena",
    "l'oreal", "garnier", "nivea", "eucerin", "cerave",
    "mac", "urban decay", "tarte", "too faced", "benefit",
}


# ── DB connection ───────────────────────────────────────────────
_db_conn = None


def get_db_connection():
    global _db_conn
    if _db_conn and not _db_conn.closed:
        return _db_conn

    sm = boto3.client("secretsmanager")
    secret = json.loads(
        sm.get_secret_value(SecretId=DB_SECRET_ARN)["SecretString"]
    )

    _db_conn = psycopg2.connect(
        host=secret["host"],
        port=secret["port"],
        dbname=secret["database"],
        user=secret["username"],
        password=secret["password"],
        connect_timeout=10,
    )
    _db_conn.autocommit = False
    return _db_conn


# ── Entry points ────────────────────────────────────────────────
def process(event, context):
    """
    Main handler. Supports two trigger types:
    - S3 event: processes a specific uploaded file
    - CloudWatch scheduled event: processes all files from today
    """
    logger.info(f"Event: {json.dumps(event, default=str)[:500]}")

    s3 = boto3.client("s3")

    # Determine which files to process
    keys_to_process = []

    if "Records" in event:
        # S3 trigger
        for record in event["Records"]:
            bucket = record["s3"]["bucket"]["name"]
            key = record["s3"]["object"]["key"]
            if key.endswith(".json") and not key.startswith("_runs/"):
                keys_to_process.append(key)
    else:
        # Scheduled trigger: process all files from today
        today = datetime.utcnow().strftime("%Y-%m-%d")
        for source in ["sephora_de", "amazon_de", "ulta"]:
            prefix = f"{source}/{today}/"
            try:
                resp = s3.list_objects_v2(Bucket=RAW_BUCKET, Prefix=prefix)
                for obj in resp.get("Contents", []):
                    if obj["Key"].endswith(".json"):
                        keys_to_process.append(obj["Key"])
            except Exception as e:
                logger.error(f"Error listing {prefix}: {e}")

    if not keys_to_process:
        logger.info("No files to process")
        return {"statusCode": 200, "processed": 0}

    total_products = 0
    total_alerts = 0

    for key in keys_to_process:
        try:
            logger.info(f"Processing: s3://{RAW_BUCKET}/{key}")
            resp = s3.get_object(Bucket=RAW_BUCKET, Key=key)
            payload = json.loads(resp["Body"].read())

            products = payload.get("products", [])
            source = payload.get("source", _infer_source(key))

            n_inserted, n_alerts = _process_products(source, products)
            total_products += n_inserted
            total_alerts += n_alerts

        except Exception as e:
            logger.error(f"Error processing {key}: {e}", exc_info=True)

    # Run daily aggregation
    _compute_aggregates()

    logger.info(
        f"Done: {total_products} products processed, {total_alerts} alerts "
        f"from {len(keys_to_process)} files"
    )
    return {
        "statusCode": 200,
        "processed": total_products,
        "alerts": total_alerts,
        "files": len(keys_to_process),
    }


# ── Core processing ─────────────────────────────────────────────
def _process_products(source: str, products: list) -> tuple:
    """Upsert products, record prices, generate anonymised records, detect alerts."""
    conn = get_db_connection()
    cur = conn.cursor()
    alerts_count = 0

    try:
        for raw in products:
            # 1. Upsert into products table
            product_id = _upsert_product(cur, source, raw)
            if not product_id:
                continue

            # 2. Record price history
            price = _parse_price(raw.get("price") or raw.get("price_text", ""))
            currency = "EUR" if "de" in source else "USD"
            if price:
                cur.execute(
                    """INSERT INTO price_history (product_id, price, currency, in_stock, scraped_at)
                       VALUES (%s, %s, %s, %s, NOW())""",
                    (product_id, price, currency, True),
                )

                # 3. Check for price alert
                if _check_price_alert(cur, product_id, price):
                    alerts_count += 1

            # 4. Upsert anonymised product
            _upsert_anonymised(cur, source, raw, product_id)

        conn.commit()
        logger.info(f"Processed {len(products)} products for {source}")
        return len(products), alerts_count

    except Exception as e:
        conn.rollback()
        logger.error(f"Error in _process_products: {e}", exc_info=True)
        return 0, 0
    finally:
        cur.close()


def _upsert_product(cur, source: str, raw: dict) -> int:
    """Insert or update a product record. Returns the product id."""
    ext_id = (
        raw.get("source_id")
        or raw.get("pid")
        or raw.get("asin")
        or raw.get("external_id")
        or ""
    )
    if not ext_id:
        ext_id = hashlib.md5(
            f"{raw.get('name','')}:{raw.get('brand','')}".encode()
        ).hexdigest()[:16]

    name = raw.get("name", "")
    brand = raw.get("brand", "")
    category = raw.get("category", "")
    url = raw.get("url") or raw.get("url_path") or ""
    image_url = raw.get("image_url") or (
        raw["image_urls"][0] if raw.get("image_urls") else None
    )
    rating = _parse_rating(raw.get("rating") or raw.get("rating_text"))
    review_count = raw.get("review_count", 0)

    cur.execute(
        """INSERT INTO products
               (source, external_id, name, brand, category, url, image_url,
                rating, review_count, first_seen_at, last_seen_at)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
           ON CONFLICT (source, external_id) DO UPDATE SET
               name = EXCLUDED.name,
               brand = COALESCE(NULLIF(EXCLUDED.brand, ''), products.brand),
               category = COALESCE(NULLIF(EXCLUDED.category, ''), products.category),
               url = COALESCE(NULLIF(EXCLUDED.url, ''), products.url),
               image_url = COALESCE(EXCLUDED.image_url, products.image_url),
               rating = COALESCE(EXCLUDED.rating, products.rating),
               review_count = GREATEST(EXCLUDED.review_count, products.review_count),
               last_seen_at = NOW()
           RETURNING id""",
        (source, ext_id, name, brand, category, url, image_url, rating, review_count),
    )
    row = cur.fetchone()
    return row[0] if row else None


def _check_price_alert(cur, product_id: int, new_price: float) -> bool:
    """Detect >15% price swings and insert alert."""
    cur.execute(
        """SELECT price FROM price_history
           WHERE product_id = %s AND scraped_at < NOW() - interval '1 hour'
           ORDER BY scraped_at DESC LIMIT 1""",
        (product_id,),
    )
    row = cur.fetchone()
    if not row or not row[0]:
        return False

    old_price = float(row[0])
    if old_price == 0:
        return False

    change_pct = (new_price - old_price) / old_price
    if abs(change_pct) >= PRICE_ALERT_THRESHOLD:
        cur.execute(
            """INSERT INTO price_alerts
                   (product_id, old_price, new_price, change_pct, detected_at)
               VALUES (%s, %s, %s, %s, NOW())""",
            (product_id, old_price, new_price, round(change_pct * 100, 2)),
        )
        logger.info(
            f"ALERT: product {product_id} price changed "
            f"{old_price} -> {new_price} ({change_pct:+.1%})"
        )
        return True
    return False


def _upsert_anonymised(cur, source: str, raw: dict, product_id: int):
    """Create/update anonymised product for frontend consumption."""
    name = raw.get("name", "")
    brand = raw.get("brand", "")
    ext_id = raw.get("source_id") or raw.get("pid") or raw.get("asin") or ""

    product_hash = hashlib.sha256(
        f"{brand}:{name}:{ext_id}".encode()
    ).hexdigest()

    name_clean = re.sub(r"\s+", " ", re.sub(r"[^\w\s\-&/]", "", name)).strip()[:500]
    brand_type = _classify_brand(brand)
    price = _parse_price(raw.get("price") or raw.get("price_text", ""))
    price_tier = _price_tier(price)

    rating = _parse_rating(raw.get("rating") or raw.get("rating_text"))
    review_count = raw.get("review_count", 0) or 0

    efficacy = {
        "rating": float(rating) if rating else None,
        "review_volume": int(review_count),
        "bestseller": bool(raw.get("badge", "") and "bestseller" in str(raw.get("badge", "")).lower()),
    }

    market = {
        "trending": 0,
        "new_arrival": False,
        "stock_status": raw.get("availability", "unknown"),
    }

    acquisition_lead = hashlib.sha256(
        f"{ext_id}:{brand}:{datetime.utcnow().strftime('%Y%m')}".encode()
    ).hexdigest()[:16]

    cur.execute(
        """INSERT INTO anonymised_products
               (product_hash, category, name_clean, brand_type, price_tier,
                efficacy_signals, market_signals, acquisition_lead, last_updated)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
           ON CONFLICT (product_hash) DO UPDATE SET
               category = COALESCE(NULLIF(EXCLUDED.category, ''), anonymised_products.category),
               name_clean = EXCLUDED.name_clean,
               brand_type = EXCLUDED.brand_type,
               price_tier = EXCLUDED.price_tier,
               efficacy_signals = EXCLUDED.efficacy_signals,
               market_signals = EXCLUDED.market_signals,
               acquisition_lead = EXCLUDED.acquisition_lead,
               last_updated = NOW()""",
        (
            product_hash,
            raw.get("category", "").replace("_", "-"),
            name_clean,
            brand_type,
            price_tier,
            json.dumps(efficacy),
            json.dumps(market),
            acquisition_lead,
        ),
    )


def _compute_aggregates(cur=None):
    """Compute daily price aggregates per source/category."""
    conn = get_db_connection()
    own_cursor = cur is None
    if own_cursor:
        cur = conn.cursor()

    try:
        cur.execute(
            """INSERT INTO price_aggregates (source, category, avg_price, min_price, max_price, product_count, computed_at)
               SELECT
                   p.source,
                   p.category,
                   ROUND(AVG(ph.price), 2),
                   MIN(ph.price),
                   MAX(ph.price),
                   COUNT(DISTINCT p.id),
                   NOW()
               FROM products p
               JOIN price_history ph ON ph.product_id = p.id
               WHERE ph.scraped_at >= NOW() - interval '24 hours'
                 AND p.category IS NOT NULL AND p.category != ''
               GROUP BY p.source, p.category
               ON CONFLICT (source, category, (DATE(computed_at))) DO UPDATE SET
                   avg_price = EXCLUDED.avg_price,
                   min_price = EXCLUDED.min_price,
                   max_price = EXCLUDED.max_price,
                   product_count = EXCLUDED.product_count,
                   computed_at = NOW()"""
        )
        if own_cursor:
            conn.commit()
        logger.info("Price aggregates computed")
    except Exception as e:
        if own_cursor:
            conn.rollback()
        logger.error(f"Aggregate computation failed: {e}")
    finally:
        if own_cursor:
            cur.close()


# ── Helpers ─────────────────────────────────────────────────────
def _infer_source(s3_key: str) -> str:
    """Infer source from S3 key path (e.g., 'sephora_de/2024-01-15/...')."""
    parts = s3_key.split("/")
    return parts[0] if parts else "unknown"


def _parse_price(price_text: str) -> float:
    """Extract numeric price from text like '29,95 EUR', '$34.00', etc."""
    if not price_text:
        return 0.0
    cleaned = str(price_text).replace("EUR", "").replace("$", "").replace("\xa0", "").strip()
    # Handle European format: 29,95
    cleaned = re.sub(r"(\d+),(\d{2})$", r"\1.\2", cleaned)
    # Handle "Ab:8,95" pattern
    cleaned = re.sub(r"^[A-Za-z:]+", "", cleaned)
    match = re.search(r"(\d+\.?\d*)", cleaned)
    return float(match.group(1)) if match else 0.0


def _parse_rating(rating_text) -> float:
    """Extract numeric rating from text like '4.2', '4,5 von 5 Sternen'."""
    if rating_text is None:
        return None
    text = str(rating_text)
    match = re.search(r"(\d+[.,]\d+)", text)
    if match:
        return float(match.group(1).replace(",", "."))
    match = re.search(r"(\d+)", text)
    if match:
        val = int(match.group(1))
        if 1 <= val <= 5:
            return float(val)
    return None


def _classify_brand(brand: str) -> str:
    lower = brand.lower().strip()
    if lower in LUXURY_BRANDS:
        return "luxury"
    if lower in MASSTIGE_BRANDS:
        return "masstige"
    return "indie"


def _price_tier(price: float) -> str:
    if not price or price <= 0:
        return "unknown"
    if price < 15:
        return "budget"
    if price < 35:
        return "mid"
    if price < 75:
        return "premium"
    return "luxury"
