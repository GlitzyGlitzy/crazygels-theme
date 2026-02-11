"""
Lambda: Catalog Promoter
Runs on schedule (daily) or on-demand via API Gateway.

Promotes anonymised_products -> product_catalog by:
  1. Finding anonymised products not yet in product_catalog
  2. Deriving product_type, efficacy_score, review_signals, suitable_for
  3. Inserting into product_catalog with status='research'
  4. Creating source_intelligence stubs with acquisition_lead linkage
  5. Updating existing catalog entries with latest efficacy data

Environment:
  DB_SECRET_ARN  - Secrets Manager ARN for RDS credentials
"""

import hashlib
import json
import logging
import os
import re
from datetime import datetime, timedelta

import boto3
import psycopg2

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DB_SECRET_ARN = os.environ["DB_SECRET_ARN"]

# ── Skin concern mapping from ingredient keywords ────────────
ACTIVE_CONCERN_MAP = {
    "niacinamide": ["acne", "hyperpigmentation", "aging"],
    "vitamin c": ["hyperpigmentation", "aging", "dullness"],
    "ascorbic acid": ["hyperpigmentation", "aging", "dullness"],
    "retinol": ["aging", "acne", "texture"],
    "retinal": ["aging", "acne", "texture"],
    "salicylic acid": ["acne", "blackheads", "oily"],
    "hyaluronic acid": ["dehydration", "dryness", "aging"],
    "glycolic acid": ["texture", "dullness", "aging"],
    "lactic acid": ["texture", "dryness", "sensitivity"],
    "azelaic acid": ["acne", "rosacea", "hyperpigmentation"],
    "benzoyl peroxide": ["acne"],
    "ceramide": ["dryness", "sensitivity", "barrier_repair"],
    "peptide": ["aging", "firmness"],
    "squalane": ["dryness", "sensitivity"],
    "zinc": ["acne", "oily", "sensitivity"],
    "centella": ["sensitivity", "redness", "barrier_repair"],
    "tea tree": ["acne", "oily"],
    "bakuchiol": ["aging", "sensitivity"],
    "tranexamic acid": ["hyperpigmentation", "melasma"],
    "arbutin": ["hyperpigmentation", "dullness"],
    "kojic acid": ["hyperpigmentation"],
    "urea": ["dryness", "texture"],
    "panthenol": ["sensitivity", "barrier_repair"],
    "allantoin": ["sensitivity", "barrier_repair"],
    "snail mucin": ["aging", "dehydration", "texture"],
    "propolis": ["acne", "sensitivity"],
}

CONTRA_MAP = {
    "retinol": ["pregnancy", "sensitive_skin_severe"],
    "retinal": ["pregnancy", "sensitive_skin_severe"],
    "salicylic acid": ["pregnancy"],
    "benzoyl peroxide": ["fungal_acne"],
    "glycolic acid": ["sensitive_skin_severe"],
    "vitamin c": [],  # generally safe
}

CATEGORY_TYPE_MAP = {
    "skincare-serums": "serum",
    "skincare-moisturizers": "moisturizer",
    "skincare-cleansers": "cleanser",
    "skincare-toners": "toner",
    "skincare-masks": "mask",
    "hair-shampoo": "shampoo",
    "nail-polish": "nail_polish",
    "fragrances": "fragrance",
}

_db_conn = None


def get_db():
    global _db_conn
    if _db_conn and not _db_conn.closed:
        return _db_conn
    sm = boto3.client("secretsmanager")
    secret = json.loads(
        sm.get_secret_value(SecretId=DB_SECRET_ARN)["SecretString"]
    )
    _db_conn = psycopg2.connect(
        host=secret["host"], port=secret["port"],
        dbname=secret["database"], user=secret["username"],
        password=secret["password"], connect_timeout=10,
    )
    _db_conn.autocommit = False
    return _db_conn


def promote(event, context):
    """Main Lambda handler."""
    conn = get_db()
    cur = conn.cursor()

    try:
        # 1. Find new anonymised products not yet in catalog
        new_count = _promote_new_products(cur)
        logger.info(f"Promoted {new_count} new products to catalog")

        # 2. Update efficacy data for existing catalog entries
        updated_count = _update_efficacy(cur)
        logger.info(f"Updated efficacy for {updated_count} existing products")

        # 3. Detect review signal trends
        trend_count = _compute_review_signals(cur)
        logger.info(f"Computed review signals for {trend_count} products")

        conn.commit()

        return {
            "statusCode": 200,
            "body": json.dumps({
                "new_promoted": new_count,
                "efficacy_updated": updated_count,
                "trends_computed": trend_count,
            })
        }

    except Exception as e:
        conn.rollback()
        logger.error(f"Promotion failed: {e}", exc_info=True)
        return {"statusCode": 500, "body": str(e)}
    finally:
        cur.close()


def _promote_new_products(cur) -> int:
    """Insert anonymised_products into product_catalog where they don't exist."""
    cur.execute("""
        SELECT ap.product_hash, ap.name_clean, ap.category, ap.brand_type,
               ap.price_tier, ap.efficacy_signals, ap.market_signals,
               ap.acquisition_lead
        FROM anonymised_products ap
        LEFT JOIN product_catalog pc ON pc.product_hash = ap.product_hash
        WHERE pc.product_hash IS NULL
          AND ap.name_clean IS NOT NULL
          AND ap.name_clean != ''
    """)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        (product_hash, name_clean, category, brand_type,
         price_tier, efficacy_raw, market_raw, acq_lead) = row

        efficacy = efficacy_raw if isinstance(efficacy_raw, dict) else json.loads(efficacy_raw or "{}")
        market = market_raw if isinstance(market_raw, dict) else json.loads(market_raw or "{}")

        product_type = CATEGORY_TYPE_MAP.get(category, category.split("-")[-1] if category else "unknown")
        rating = efficacy.get("rating")
        efficacy_score = float(rating) if rating else None

        # Derive key_actives and suitable_for from product name
        name_lower = name_clean.lower() if name_clean else ""
        key_actives = []
        suitable_for = set()
        contraindications = set()

        for active, concerns in ACTIVE_CONCERN_MAP.items():
            if active in name_lower:
                key_actives.append(active.replace(" ", "_"))
                suitable_for.update(concerns)

        for active, contras in CONTRA_MAP.items():
            if active in name_lower:
                contraindications.update(contras)

        # If no actives detected, use category defaults
        if not suitable_for:
            category_defaults = {
                "serum": ["general_skincare"],
                "moisturizer": ["dryness", "dehydration"],
                "cleanser": ["general_skincare"],
                "toner": ["general_skincare"],
                "mask": ["general_skincare"],
            }
            suitable_for = set(category_defaults.get(product_type, ["general_skincare"]))

        # Generate display name (clean, no source attribution)
        display_name = name_clean[:255] if name_clean else f"Unknown {product_type.title()}"

        cur.execute("""
            INSERT INTO product_catalog
                (product_hash, display_name, category, product_type, price_tier,
                 efficacy_score, review_signals, key_actives, suitable_for,
                 contraindications, status, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'stable', %s, %s, %s, 'research', NOW(), NOW())
            ON CONFLICT (product_hash) DO NOTHING
        """, (
            product_hash, display_name, category, product_type, price_tier,
            efficacy_score,
            list(key_actives) if key_actives else None,
            list(suitable_for) if suitable_for else None,
            list(contraindications) if contraindications else None,
        ))

        # Create source_intelligence stub
        if acq_lead:
            cur.execute("""
                INSERT INTO source_intelligence
                    (acquisition_lead, product_hash, created_at, updated_at)
                VALUES (%s, %s, NOW(), NOW())
                ON CONFLICT (acquisition_lead) DO UPDATE SET
                    product_hash = EXCLUDED.product_hash,
                    updated_at = NOW()
            """, (acq_lead[:32], product_hash))

        count += 1

    return count


def _update_efficacy(cur) -> int:
    """Update efficacy_score for existing catalog entries from latest scrape data."""
    cur.execute("""
        UPDATE product_catalog pc
        SET
            efficacy_score = COALESCE(
                (ap.efficacy_signals->>'rating')::DECIMAL,
                pc.efficacy_score
            ),
            price_tier = COALESCE(NULLIF(ap.price_tier, 'unknown'), pc.price_tier),
            updated_at = NOW()
        FROM anonymised_products ap
        WHERE ap.product_hash = pc.product_hash
          AND ap.last_updated > pc.updated_at - interval '1 day'
    """)
    return cur.rowcount


def _compute_review_signals(cur) -> int:
    """
    Determine review trend: 'trending' if review count grew >20% in 30 days,
    'declining' if rating dropped >0.3, otherwise 'stable'.
    """
    cur.execute("""
        WITH recent AS (
            SELECT product_hash, efficacy_signals, last_updated
            FROM anonymised_products
            WHERE last_updated > NOW() - interval '7 days'
        ),
        older AS (
            SELECT product_hash, efficacy_signals, last_updated
            FROM anonymised_products
            WHERE last_updated BETWEEN NOW() - interval '37 days' AND NOW() - interval '30 days'
        )
        UPDATE product_catalog pc
        SET review_signals = CASE
            WHEN (r.efficacy_signals->>'review_volume')::INT >
                 (o.efficacy_signals->>'review_volume')::INT * 1.2
            THEN 'trending'
            WHEN (r.efficacy_signals->>'rating')::DECIMAL <
                 (o.efficacy_signals->>'rating')::DECIMAL - 0.3
            THEN 'declining'
            ELSE 'stable'
        END,
        updated_at = NOW()
        FROM recent r
        JOIN older o ON o.product_hash = r.product_hash
        WHERE pc.product_hash = r.product_hash
    """)
    return cur.rowcount
