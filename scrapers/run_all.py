"""
Unified intelligence runner -- scrapes all sources and produces a combined
anonymised dataset, uploads to S3, and optionally writes to PostgreSQL.

Run:
    python scrapers/run_all.py --pages 2
    python scrapers/run_all.py --sources sephora,amazon --pages 1
    python scrapers/run_all.py --category skincare_serums --pages 2
    python scrapers/run_all.py --pages 2 --s3        # upload raw to S3
    python scrapers/run_all.py --pages 2 --postgres   # insert into RDS
"""

import argparse
import json
import logging
import os
import subprocess
import sys
from datetime import datetime

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

SCRAPERS = {
    "sephora": "scrapers/sephora/scraper_api.py",
    "ulta": "scrapers/ulta/scraper_api.py",
    "amazon": "scrapers/amazon/scraper_api.py",
}

OUTPUT_FILES = {
    "sephora": "data/sephora_intelligence.json",
    "ulta": "data/ulta_intelligence.json",
    "amazon": "data/amazon_intelligence.json",
}


def run_scraper(
    source: str, pages: int, category: str | None = None
) -> tuple[str, int, bool]:
    """Run a single scraper as a subprocess.

    Returns (source_name, product_count, success).
    """
    script = SCRAPERS[source]
    output_file = OUTPUT_FILES[source]

    cmd = [sys.executable, script, "--pages", str(pages), "--output", output_file]
    if category:
        cmd.extend(["--category", category])

    logger.info(f"Running {source} scraper: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=600
        )

        # Log output
        if result.stdout:
            for line in result.stdout.strip().split("\n"):
                logger.info(f"  [{source}] {line}")
        if result.stderr:
            for line in result.stderr.strip().split("\n"):
                if "[ERROR]" in line or "[WARNING]" in line:
                    logger.warning(f"  [{source}] {line}")

        if result.returncode != 0:
            logger.error(f"{source} scraper exited with code {result.returncode}")
            return source, 0, False

        # Count products in output
        if os.path.exists(output_file):
            with open(output_file) as f:
                products = json.load(f)
            return source, len(products), True

        return source, 0, False

    except subprocess.TimeoutExpired:
        logger.error(f"{source} scraper timed out after 600s")
        return source, 0, False
    except Exception as e:
        logger.error(f"{source} scraper failed: {e}")
        return source, 0, False


def merge_outputs(output_path: str) -> int:
    """Merge all individual source outputs into a single combined file."""
    combined = []

    for source, filepath in OUTPUT_FILES.items():
        if os.path.exists(filepath):
            try:
                with open(filepath) as f:
                    products = json.load(f)
                combined.extend(products)
                logger.info(f"  Merged {len(products)} from {source}")
            except Exception as e:
                logger.error(f"  Failed to read {filepath}: {e}")

    if combined:
        # Add metadata
        output = {
            "generated_at": datetime.utcnow().isoformat(),
            "total_products": len(combined),
            "sources": {
                source: sum(1 for p in combined if p.get("source", "").startswith(source[:4]))
                for source in OUTPUT_FILES
            },
            "products": combined,
        }

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        logger.info(f"Combined {len(combined)} products saved to {output_path}")

    return len(combined)


def main():
    parser = argparse.ArgumentParser(description="Run all intelligence scrapers")
    parser.add_argument(
        "--sources", default="sephora,ulta,amazon",
        help="Comma-separated list of sources (default: all)",
    )
    parser.add_argument("--pages", type=int, default=2, help="Pages per category")
    parser.add_argument(
        "--category", default=None,
        help="Single category to scrape across all sources",
    )
    parser.add_argument(
        "--output", default="data/combined_intelligence.json",
        help="Combined output file path",
    )
    parser.add_argument(
        "--s3", action="store_true",
        help="Upload raw data to S3 (requires AWS credentials)",
    )
    parser.add_argument(
        "--postgres", action="store_true",
        help="Insert directly into PostgreSQL (requires DB env vars or Secrets Manager)",
    )
    args = parser.parse_args()

    sources = [s.strip() for s in args.sources.split(",")]
    invalid = [s for s in sources if s not in SCRAPERS]
    if invalid:
        logger.error(f"Unknown sources: {invalid}. Available: {list(SCRAPERS.keys())}")
        return

    logger.info(f"Starting intelligence run: sources={sources}, pages={args.pages}")
    started = datetime.utcnow()

    results = []
    for source in sources:
        source_name, count, success = run_scraper(source, args.pages, args.category)
        results.append((source_name, count, success))

    # Merge all outputs
    total = merge_outputs(args.output)

    # S3 upload (if enabled)
    if args.s3:
        try:
            from scrapers.common.s3_uploader import upload_raw_batched, upload_anonymised, log_scrape_run

            source_map = {"sephora": "sephora_de", "amazon": "amazon_de", "ulta": "ulta"}
            for source in sources:
                filepath = OUTPUT_FILES[source]
                if not os.path.exists(filepath):
                    continue
                with open(filepath) as f:
                    products = json.load(f)
                s3_source = source_map.get(source, source)

                # Upload raw data
                paths = upload_raw_batched(s3_source, products, args.category)
                logger.info(f"  S3 raw: {source} -> {len(paths)} files uploaded")

                # Upload anonymised intelligence
                anon_path = upload_anonymised(s3_source, products)
                logger.info(f"  S3 anon: {source} -> {anon_path}")

                # Log run metadata
                count = sum(1 for _, c, _ in results if _ == source for _ in [c])
                log_scrape_run(
                    s3_source, started,
                    product_count=len(products),
                    page_count=args.pages,
                )
        except ImportError:
            logger.warning("S3 upload skipped: boto3 not installed")
        except Exception as e:
            logger.error(f"S3 upload failed: {e}")

    # PostgreSQL insert (if enabled)
    if args.postgres:
        try:
            _insert_to_postgres(args.output)
        except Exception as e:
            logger.error(f"PostgreSQL insert failed: {e}")

    elapsed = (datetime.utcnow() - started).total_seconds()
    logger.info(f"\n{'='*50}")
    logger.info(f"Intelligence run complete in {elapsed:.0f}s")
    logger.info(f"{'='*50}")
    for source_name, count, success in results:
        status = "OK" if success else "FAILED"
        logger.info(f"  {source_name:>10}: {count:>4} products [{status}]")
    logger.info(f"  {'TOTAL':>10}: {total:>4} products")
    logger.info(f"  Output: {args.output}")
    if args.s3:
        logger.info(f"  S3: uploaded to crazygels-scraper-raw-data")
    if args.postgres:
        logger.info(f"  PostgreSQL: inserted into scraper_db")


def _insert_to_postgres(combined_path: str):
    """Insert anonymised products directly into PostgreSQL.

    Reads DB credentials from environment variables:
      RDS_HOST, RDS_PORT, RDS_DATABASE, RDS_USERNAME, RDS_PASSWORD
    Or from AWS Secrets Manager via DB_SECRET_ARN.
    """
    import psycopg2

    host = os.getenv("RDS_HOST")
    if host:
        conn = psycopg2.connect(
            host=host,
            port=os.getenv("RDS_PORT", "5432"),
            dbname=os.getenv("RDS_DATABASE", "scraper_db"),
            user=os.getenv("RDS_USERNAME", "scraper_admin"),
            password=os.getenv("RDS_PASSWORD"),
        )
    else:
        # Try Secrets Manager
        import boto3
        sm = boto3.client("secretsmanager")
        secret = json.loads(
            sm.get_secret_value(SecretId=os.environ["DB_SECRET_ARN"])["SecretString"]
        )
        conn = psycopg2.connect(
            host=secret["host"],
            port=secret["port"],
            dbname=secret["database"],
            user=secret["username"],
            password=secret["password"],
        )

    with open(combined_path) as f:
        data = json.load(f)

    products = data.get("products", data) if isinstance(data, dict) else data
    cur = conn.cursor()

    inserted = 0
    for p in products:
        try:
            cur.execute(
                """INSERT INTO anonymised_products
                       (product_hash, category, name_clean, brand_type, price_tier,
                        efficacy_signals, market_signals, acquisition_lead, last_updated)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())
                   ON CONFLICT (product_hash) DO UPDATE SET
                       category = EXCLUDED.category,
                       name_clean = EXCLUDED.name_clean,
                       brand_type = EXCLUDED.brand_type,
                       price_tier = EXCLUDED.price_tier,
                       efficacy_signals = EXCLUDED.efficacy_signals,
                       market_signals = EXCLUDED.market_signals,
                       acquisition_lead = EXCLUDED.acquisition_lead,
                       last_updated = NOW()""",
                (
                    p.get("product_hash"),
                    p.get("category"),
                    p.get("name_clean"),
                    p.get("brand_type"),
                    p.get("price_tier"),
                    json.dumps(p.get("efficacy_signals", {})),
                    json.dumps(p.get("market_signals", {})),
                    p.get("acquisition_lead"),
                ),
            )
            inserted += 1
        except Exception as e:
            logger.warning(f"Failed to insert product: {e}")

    conn.commit()
    cur.close()
    conn.close()
    logger.info(f"PostgreSQL: inserted/updated {inserted} anonymised products")


if __name__ == "__main__":
    main()
