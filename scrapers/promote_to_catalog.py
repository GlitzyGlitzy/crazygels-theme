"""
Local catalog promotion: reads scraped JSON files and promotes products
into product_catalog format (JSON or PostgreSQL).

Usage:
    # Generate catalog JSON from scraped data (no DB required)
    python scrapers/promote_to_catalog.py --output data/product_catalog.json

    # Promote directly into local PostgreSQL
    python scrapers/promote_to_catalog.py --postgres

    # Promote a specific source file only
    python scrapers/promote_to_catalog.py --input data/sephora_intelligence.json --output data/catalog.json
"""

import argparse
import hashlib
import json
import logging
import os
import re
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ── Ingredient -> concern mapping ────────────────────────────
ACTIVE_CONCERN_MAP = {
    "niacinamide": {"concerns": ["acne", "hyperpigmentation", "aging"], "group": "actives"},
    "vitamin c": {"concerns": ["hyperpigmentation", "aging", "dullness"], "group": "actives"},
    "ascorbic acid": {"concerns": ["hyperpigmentation", "aging", "dullness"], "group": "actives"},
    "retinol": {"concerns": ["aging", "acne", "texture"], "group": "actives"},
    "retinal": {"concerns": ["aging", "acne", "texture"], "group": "actives"},
    "salicylic acid": {"concerns": ["acne", "blackheads", "oily"], "group": "actives"},
    "hyaluronic acid": {"concerns": ["dehydration", "dryness", "aging"], "group": "humectants"},
    "glycolic acid": {"concerns": ["texture", "dullness", "aging"], "group": "actives"},
    "lactic acid": {"concerns": ["texture", "dryness", "sensitivity"], "group": "actives"},
    "azelaic acid": {"concerns": ["acne", "rosacea", "hyperpigmentation"], "group": "actives"},
    "ceramide": {"concerns": ["dryness", "sensitivity", "barrier_repair"], "group": "emollients"},
    "peptide": {"concerns": ["aging", "firmness"], "group": "actives"},
    "squalane": {"concerns": ["dryness", "sensitivity"], "group": "emollients"},
    "zinc": {"concerns": ["acne", "oily", "sensitivity"], "group": "actives"},
    "centella": {"concerns": ["sensitivity", "redness", "barrier_repair"], "group": "actives"},
    "tea tree": {"concerns": ["acne", "oily"], "group": "actives"},
    "bakuchiol": {"concerns": ["aging", "sensitivity"], "group": "actives"},
    "tranexamic acid": {"concerns": ["hyperpigmentation", "melasma"], "group": "actives"},
    "arbutin": {"concerns": ["hyperpigmentation", "dullness"], "group": "actives"},
    "urea": {"concerns": ["dryness", "texture"], "group": "humectants"},
    "panthenol": {"concerns": ["sensitivity", "barrier_repair"], "group": "humectants"},
    "snail mucin": {"concerns": ["aging", "dehydration", "texture"], "group": "humectants"},
    "propolis": {"concerns": ["acne", "sensitivity"], "group": "actives"},
    "collagen": {"concerns": ["aging", "firmness"], "group": "humectants"},
    "aloe": {"concerns": ["sensitivity", "hydration"], "group": "humectants"},
}

CONTRA_MAP = {
    "retinol": ["pregnancy", "sensitive_skin_severe"],
    "retinal": ["pregnancy", "sensitive_skin_severe"],
    "salicylic acid": ["pregnancy"],
    "benzoyl peroxide": ["fungal_acne"],
    "glycolic acid": ["sensitive_skin_severe"],
}

# ── Currency conversion ───────────────────────────────────────
USD_TO_EUR = 0.92  # Fixed rate; update periodically or use a live API


def convert_to_eur(price: float, currency: str) -> float:
    """Convert a price to EUR. Returns the price unchanged if already EUR."""
    if not price or price <= 0:
        return 0.0
    currency = (currency or "EUR").upper()
    if currency == "EUR":
        return round(price, 2)
    if currency == "USD":
        return round(price * USD_TO_EUR, 2)
    if currency == "GBP":
        return round(price * 1.17, 2)  # Approximate
    return round(price, 2)  # Unknown currency, keep as-is


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


def promote_product(anon: dict, staging: dict = None) -> dict:
    """Convert an anonymised product into a product_catalog entry.

    If staging data is provided, real prices/images/URLs are preserved.
    """
    # Prefer staging data for name (it has the original full name)
    name = (staging or {}).get("name_original") or anon.get("name_clean", "")
    category = anon.get("category", "").replace("_", "-")
    product_type = CATEGORY_TYPE_MAP.get(category, category.split("-")[-1] if category else "unknown")

    name_lower = name.lower()
    key_actives = []
    suitable_for = set()
    contraindications = set()
    ingredient_summary = {"actives": 0, "humectants": 0, "emollients": 0}

    for active, info in ACTIVE_CONCERN_MAP.items():
        if active in name_lower:
            key_actives.append(active.replace(" ", "_"))
            suitable_for.update(info["concerns"])
            ingredient_summary[info["group"]] = ingredient_summary.get(info["group"], 0) + 1

    for active, contras in CONTRA_MAP.items():
        if active in name_lower:
            contraindications.update(contras)

    if not suitable_for:
        defaults = {
            "serum": ["general_skincare"],
            "moisturizer": ["dryness", "dehydration"],
            "cleanser": ["general_skincare"],
            "toner": ["general_skincare"],
            "mask": ["general_skincare"],
            "shampoo": ["general_haircare"],
            "nail_polish": ["nail_care"],
            "fragrance": ["general_fragrance"],
        }
        suitable_for = set(defaults.get(product_type, ["general"]))

    efficacy = anon.get("efficacy_signals", {})
    if isinstance(efficacy, str):
        efficacy = json.loads(efficacy)
    rating = efficacy.get("rating")
    efficacy_score = float(rating) if rating and str(rating) != "null" else None

    # Extract real data from staging if available
    s = staging or {}
    price_original = s.get("price_original", 0) or 0
    price_currency = s.get("price_currency", "EUR") or "EUR"
    retail_price = convert_to_eur(price_original, price_currency) if price_original > 0 else None

    return {
        "product_hash": anon.get("product_hash", ""),
        "display_name": name[:255] if name else f"Unknown {product_type.title()}",
        "category": category,
        "product_type": product_type,
        "price_tier": anon.get("price_tier", "unknown"),
        "efficacy_score": efficacy_score,
        "review_signals": "stable",
        "key_actives": list(key_actives) if key_actives else [],
        "ingredient_summary": ingredient_summary,
        "suitable_for": list(suitable_for),
        "contraindications": list(contraindications),
        # Real data from staging (no longer hardcoded None)
        "image_url": s.get("image_url"),
        "description_generated": s.get("description"),
        "source_url": s.get("source_url"),
        "brand": s.get("brand"),
        "retail_price": retail_price,
        "currency": "EUR" if retail_price else None,
        "price_original": price_original if price_original > 0 else None,
        "price_currency": price_currency if price_original > 0 else None,
        "status": "research",
        "acquisition_lead": anon.get("acquisition_lead"),
        "source": s.get("source") or anon.get("source", "unknown"),
        "created_at": datetime.utcnow().isoformat(),
    }


def load_scraped_data(paths: list[str]) -> list[dict]:
    """Load all anonymised products from JSON files."""
    all_products = []
    for path in paths:
        if not os.path.exists(path):
            continue
        with open(path) as f:
            data = json.load(f)
        products = data if isinstance(data, list) else data.get("products", [])
        logger.info(f"Loaded {len(products)} products from {path}")
        all_products.extend(products)
    return all_products


def load_staging_data(anon_paths: list[str]) -> dict:
    """Load staging data keyed by product_hash.

    For each anonymised file like 'ulta_intelligence.json', looks for
    a corresponding 'ulta_intelligence_staging.json' in the same directory.
    """
    staging_by_hash = {}
    for anon_path in anon_paths:
        staging_path = anon_path.replace(".json", "_staging.json")
        if not os.path.exists(staging_path):
            logger.info(f"No staging file for {anon_path} (expected {staging_path})")
            continue
        with open(staging_path) as f:
            data = json.load(f)
        items = data if isinstance(data, list) else data.get("products", [])
        for item in items:
            ph = item.get("product_hash")
            if ph:
                staging_by_hash[ph] = item
        logger.info(f"Loaded {len(items)} staging products from {staging_path}")
    logger.info(f"Total staging entries: {len(staging_by_hash)} (with prices/images/URLs)")
    return staging_by_hash


def insert_postgres(catalog_entries: list[dict], use_neon: bool = False):
    """Insert catalog entries into PostgreSQL (RDS or Neon)."""
    import psycopg2

    if use_neon:
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            logger.error("DATABASE_URL not set. Add it to .env.local or export it.")
            return
        logger.info("Connecting to Neon database...")
        conn = psycopg2.connect(db_url)
    else:
        logger.info("Connecting to RDS database...")
        conn = psycopg2.connect(
            host=os.getenv("RDS_HOST", "localhost"),
            port=os.getenv("RDS_PORT", "5432"),
            dbname=os.getenv("RDS_DATABASE", "crazygels"),
            user=os.getenv("RDS_USER", "scraper_admin"),
            password=os.getenv("RDS_PASSWORD", ""),
        )
    cur = conn.cursor()

    inserted = 0
    for entry in catalog_entries:
        try:
            cur.execute("""
                INSERT INTO product_catalog
                    (product_hash, display_name, category, product_type, price_tier,
                     efficacy_score, review_signals, key_actives, ingredient_summary,
                     suitable_for, contraindications, image_url, description_generated,
                     source_url, retail_price, currency, source, status, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (product_hash) DO UPDATE SET
                    efficacy_score = COALESCE(EXCLUDED.efficacy_score, product_catalog.efficacy_score),
                    price_tier = COALESCE(NULLIF(EXCLUDED.price_tier, 'unknown'), product_catalog.price_tier),
                    key_actives = COALESCE(EXCLUDED.key_actives, product_catalog.key_actives),
                    suitable_for = COALESCE(EXCLUDED.suitable_for, product_catalog.suitable_for),
                    image_url = COALESCE(EXCLUDED.image_url, product_catalog.image_url),
                    description_generated = COALESCE(EXCLUDED.description_generated, product_catalog.description_generated),
                    source_url = COALESCE(EXCLUDED.source_url, product_catalog.source_url),
                    retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price),
                    currency = COALESCE(EXCLUDED.currency, product_catalog.currency),
                    updated_at = NOW()
            """, (
                entry["product_hash"],
                entry["display_name"],
                entry["category"],
                entry["product_type"],
                entry["price_tier"],
                entry["efficacy_score"],
                entry["review_signals"],
                entry["key_actives"] or None,
                json.dumps(entry["ingredient_summary"]),
                entry["suitable_for"] or None,
                entry["contraindications"] or None,
                entry.get("image_url"),
                entry.get("description_generated"),
                entry.get("source_url"),
                entry.get("retail_price"),
                entry.get("currency"),
                entry.get("source", "unknown"),
                entry["status"],
            ))
            inserted += 1
        except Exception as e:
            logger.warning(f"Failed: {e}")

    conn.commit()
    cur.close()
    conn.close()
    logger.info(f"PostgreSQL: inserted/updated {inserted} catalog entries")


def main():
    pa = argparse.ArgumentParser(description="Promote scraped products to product_catalog")
    pa.add_argument("--input", nargs="*", help="Input JSON files (default: all data/*.json)")
    pa.add_argument("--output", default="data/product_catalog.json", help="Output JSON file")
    pa.add_argument("--postgres", action="store_true", help="Insert into RDS PostgreSQL instead of JSON")
    pa.add_argument("--neon", action="store_true", help="Insert into Neon database (uses DATABASE_URL from .env.local)")
    args = pa.parse_args()

    # Load env vars from .env.local if it exists
    env_file = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    if os.path.exists(env_file):
        with open(env_file) as ef:
            for line in ef:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ.setdefault(key.strip(), val.strip())

    # Find input files
    if args.input:
        paths = args.input
    else:
        data_dir = "data"
        paths = [
            os.path.join(data_dir, f)
            for f in os.listdir(data_dir)
            if f.endswith("_intelligence.json")
        ] if os.path.isdir(data_dir) else []

    if not paths:
        logger.error("No input files found")
        return

    # Load anonymised + staging data
    raw_products = load_scraped_data(paths)
    staging_by_hash = load_staging_data(paths)

    seen_hashes = set()
    catalog = []
    with_real_data = 0

    for prod in raw_products:
        ph = prod.get("product_hash")
        if ph and ph not in seen_hashes:
            seen_hashes.add(ph)
            staging = staging_by_hash.get(ph)
            entry = promote_product(prod, staging)
            catalog.append(entry)
            if entry.get("retail_price") and entry["retail_price"] > 0:
                with_real_data += 1

    logger.info(f"Promoted {len(catalog)} unique products ({with_real_data} with real prices/images)")

    # Stats
    by_type = {}
    by_concern = {}
    for entry in catalog:
        pt = entry["product_type"]
        by_type[pt] = by_type.get(pt, 0) + 1
        for c in entry["suitable_for"]:
            by_concern[c] = by_concern.get(c, 0) + 1

    logger.info("By product type:")
    for k, v in sorted(by_type.items(), key=lambda x: -x[1]):
        logger.info(f"  {k}: {v}")
    logger.info("By concern coverage:")
    for k, v in sorted(by_concern.items(), key=lambda x: -x[1])[:10]:
        logger.info(f"  {k}: {v} products")

    # Output
    if args.neon:
        insert_postgres(catalog, use_neon=True)
    elif args.postgres:
        insert_postgres(catalog, use_neon=False)
    else:
        os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
        with open(args.output, "w") as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved to {args.output}")


if __name__ == "__main__":
    main()
