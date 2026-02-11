"""
S3 upload module for scrapers.
Uploads raw JSON data to the crazygels-raw-data bucket, partitioned by
source and date: s3://crazygels-raw-data/{source}/{YYYY-MM-DD}/products_{batch}.json

Works with or without AWS credentials — falls back to local file storage
when running locally without S3 access.
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Bucket names from Terraform outputs / environment
RAW_BUCKET = os.getenv("RAW_BUCKET", "crazygels-scraper-raw-data")
EXPORT_BUCKET = os.getenv("EXPORT_BUCKET", "crazygels-scraper-exports")
AWS_REGION = os.getenv("AWS_REGION", "eu-central-1")

# Batch size for uploads
BATCH_SIZE = 500


def _get_s3_client():
    """Lazily create an S3 client. Returns None if AWS is not configured."""
    try:
        import boto3
        client = boto3.client("s3", region_name=AWS_REGION)
        # Quick check that credentials work
        client.head_bucket(Bucket=RAW_BUCKET)
        return client
    except Exception as e:
        logger.warning(f"S3 not available ({e}), will use local storage")
        return None


def upload_raw_products(
    source: str,
    products: List[Dict[str, Any]],
    category: Optional[str] = None,
) -> str:
    """
    Upload raw product data to S3 (or local fallback).

    Args:
        source: Retailer name ('sephora_de', 'amazon_de', 'ulta')
        products: List of raw product dicts (pre-anonymisation)
        category: Optional category for filename partitioning

    Returns:
        The S3 key (or local path) where data was stored
    """
    if not products:
        logger.warning(f"No products to upload for {source}")
        return ""

    today = datetime.utcnow().strftime("%Y-%m-%d")
    timestamp = datetime.utcnow().strftime("%H%M%S")
    cat_suffix = f"_{category}" if category else ""
    filename = f"products{cat_suffix}_{timestamp}.json"
    s3_key = f"{source}/{today}/{filename}"

    payload = {
        "source": source,
        "scraped_at": datetime.utcnow().isoformat(),
        "category": category,
        "product_count": len(products),
        "products": products,
    }
    json_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

    s3 = _get_s3_client()
    if s3:
        try:
            s3.put_object(
                Bucket=RAW_BUCKET,
                Key=s3_key,
                Body=json_bytes,
                ContentType="application/json",
                ServerSideEncryption="aws:kms",
                Metadata={
                    "source": source,
                    "category": category or "all",
                    "product_count": str(len(products)),
                },
            )
            logger.info(f"Uploaded {len(products)} products to s3://{RAW_BUCKET}/{s3_key}")
            return f"s3://{RAW_BUCKET}/{s3_key}"
        except Exception as e:
            logger.error(f"S3 upload failed: {e}, falling back to local")

    # Local fallback
    local_dir = Path("data") / "raw" / source / today
    local_dir.mkdir(parents=True, exist_ok=True)
    local_path = local_dir / filename
    local_path.write_bytes(json_bytes)
    logger.info(f"Saved {len(products)} products locally to {local_path}")
    return str(local_path)


def upload_raw_batched(
    source: str,
    products: List[Dict[str, Any]],
    category: Optional[str] = None,
) -> List[str]:
    """
    Upload products in batches of BATCH_SIZE to avoid oversized files.
    Returns list of S3 keys / local paths.
    """
    paths = []
    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i : i + BATCH_SIZE]
        path = upload_raw_products(source, batch, category)
        if path:
            paths.append(path)
    return paths


def upload_anonymised(
    source: str,
    anonymised_products: List[Dict[str, Any]],
) -> str:
    """
    Upload anonymised intelligence data to the exports bucket.
    This is the frontend-safe data without source attribution.
    """
    today = datetime.utcnow().strftime("%Y-%m-%d")
    timestamp = datetime.utcnow().strftime("%H%M%S")
    s3_key = f"intelligence/{source}/{today}/anonymised_{timestamp}.json"

    payload = {
        "source": source,
        "generated_at": datetime.utcnow().isoformat(),
        "product_count": len(anonymised_products),
        "products": anonymised_products,
    }
    json_bytes = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

    s3 = _get_s3_client()
    if s3:
        try:
            s3.put_object(
                Bucket=EXPORT_BUCKET,
                Key=s3_key,
                Body=json_bytes,
                ContentType="application/json",
                ServerSideEncryption="aws:kms",
            )
            logger.info(
                f"Uploaded {len(anonymised_products)} anonymised products "
                f"to s3://{EXPORT_BUCKET}/{s3_key}"
            )
            return f"s3://{EXPORT_BUCKET}/{s3_key}"
        except Exception as e:
            logger.error(f"S3 export upload failed: {e}, falling back to local")

    # Local fallback
    local_dir = Path("data") / "exports" / source / today
    local_dir.mkdir(parents=True, exist_ok=True)
    local_path = local_dir / f"anonymised_{timestamp}.json"
    local_path.write_bytes(json_bytes)
    logger.info(f"Saved anonymised data locally to {local_path}")
    return str(local_path)


def log_scrape_run(
    source: str,
    started_at: datetime,
    product_count: int,
    error_count: int = 0,
    page_count: int = 0,
) -> str:
    """Upload scrape run metadata for auditing."""
    finished_at = datetime.utcnow()
    duration = (finished_at - started_at).total_seconds()

    run_log = {
        "source": source,
        "started_at": started_at.isoformat(),
        "finished_at": finished_at.isoformat(),
        "duration_secs": round(duration, 2),
        "product_count": product_count,
        "error_count": error_count,
        "page_count": page_count,
    }

    today = datetime.utcnow().strftime("%Y-%m-%d")
    timestamp = datetime.utcnow().strftime("%H%M%S")
    s3_key = f"_runs/{source}/{today}/run_{timestamp}.json"
    json_bytes = json.dumps(run_log, indent=2).encode("utf-8")

    s3 = _get_s3_client()
    if s3:
        try:
            s3.put_object(
                Bucket=RAW_BUCKET,
                Key=s3_key,
                Body=json_bytes,
                ContentType="application/json",
            )
            logger.info(f"Logged scrape run to s3://{RAW_BUCKET}/{s3_key}")
            return f"s3://{RAW_BUCKET}/{s3_key}"
        except Exception:
            pass

    local_dir = Path("data") / "runs" / source
    local_dir.mkdir(parents=True, exist_ok=True)
    local_path = local_dir / f"run_{today}_{timestamp}.json"
    local_path.write_bytes(json_bytes)
    return str(local_path)
