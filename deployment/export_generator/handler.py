"""
Lambda: Export Generator
Triggered weekly (Monday 10:00 UTC) by CloudWatch cron.

Generates:
  1. Weekly competitor analysis JSON (anonymised, frontend-safe)
  2. Price trend CSV for internal analytics
  3. Price alert summary for the purchasing team
  4. Acquisition lead report (encrypted source mappings)

Outputs uploaded to s3://crazygels-scraper-exports/
"""

import csv
import io
import json
import logging
import os
from datetime import datetime, timedelta

import boto3
import psycopg2

logger = logging.getLogger()
logger.setLevel(logging.INFO)

DB_SECRET_ARN = os.environ["DB_SECRET_ARN"]
EXPORT_BUCKET = os.environ["EXPORT_BUCKET"]

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
    return _db_conn


def export_data(event, context):
    """Main handler: generate all weekly exports."""
    logger.info(f"Export generator triggered: {json.dumps(event, default=str)[:200]}")

    s3 = boto3.client("s3")
    today = datetime.utcnow().strftime("%Y-%m-%d")
    week = datetime.utcnow().strftime("%Y-W%V")

    results = {}

    # 1. Weekly competitor intelligence (frontend-safe JSON)
    try:
        data = _generate_intelligence_report()
        key = f"weekly/{week}/competitor_intelligence.json"
        s3.put_object(
            Bucket=EXPORT_BUCKET,
            Key=key,
            Body=json.dumps(data, indent=2, ensure_ascii=False, default=str).encode(),
            ContentType="application/json",
            ServerSideEncryption="aws:kms",
        )
        results["intelligence"] = {"key": key, "products": len(data.get("products", []))}
        logger.info(f"Intelligence report: {len(data.get('products', []))} products -> {key}")
    except Exception as e:
        logger.error(f"Intelligence report failed: {e}", exc_info=True)
        results["intelligence"] = {"error": str(e)}

    # 2. Price trends CSV
    try:
        csv_data = _generate_price_trends_csv()
        key = f"weekly/{week}/price_trends.csv"
        s3.put_object(
            Bucket=EXPORT_BUCKET,
            Key=key,
            Body=csv_data.encode("utf-8"),
            ContentType="text/csv",
            ServerSideEncryption="aws:kms",
        )
        results["price_trends"] = {"key": key}
        logger.info(f"Price trends CSV -> {key}")
    except Exception as e:
        logger.error(f"Price trends failed: {e}", exc_info=True)
        results["price_trends"] = {"error": str(e)}

    # 3. Price alert summary
    try:
        alerts = _generate_alert_summary()
        key = f"weekly/{week}/price_alerts.json"
        s3.put_object(
            Bucket=EXPORT_BUCKET,
            Key=key,
            Body=json.dumps(alerts, indent=2, default=str).encode(),
            ContentType="application/json",
            ServerSideEncryption="aws:kms",
        )
        results["alerts"] = {"key": key, "count": len(alerts.get("alerts", []))}
        logger.info(f"Alert summary: {len(alerts.get('alerts', []))} alerts -> {key}")
    except Exception as e:
        logger.error(f"Alert summary failed: {e}", exc_info=True)
        results["alerts"] = {"error": str(e)}

    # 4. Acquisition leads report (internal only)
    try:
        leads = _generate_acquisition_report()
        key = f"weekly/{week}/acquisition_leads.json"
        s3.put_object(
            Bucket=EXPORT_BUCKET,
            Key=key,
            Body=json.dumps(leads, indent=2, default=str).encode(),
            ContentType="application/json",
            ServerSideEncryption="aws:kms",
        )
        results["leads"] = {"key": key, "count": len(leads.get("leads", []))}
        logger.info(f"Acquisition leads: {len(leads.get('leads', []))} -> {key}")
    except Exception as e:
        logger.error(f"Acquisition report failed: {e}", exc_info=True)
        results["leads"] = {"error": str(e)}

    return {"statusCode": 200, "exports": results}


# ── Report generators ───────────────────────────────────────────

def _generate_intelligence_report() -> dict:
    """Frontend-safe anonymised product intelligence."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """SELECT product_hash, category, name_clean, brand_type, price_tier,
                  efficacy_signals, market_signals, acquisition_lead, last_updated
           FROM anonymised_products
           WHERE last_updated >= NOW() - interval '7 days'
           ORDER BY last_updated DESC"""
    )
    rows = cur.fetchall()
    cur.close()

    products = []
    for row in rows:
        products.append({
            "product_hash": row[0],
            "category": row[1],
            "name_clean": row[2],
            "brand_type": row[3],
            "price_tier": row[4],
            "efficacy_signals": row[5],
            "market_signals": row[6],
            "acquisition_lead": row[7],
            "last_updated": row[8].isoformat() if row[8] else None,
        })

    # Category breakdown
    categories = {}
    for p in products:
        cat = p["category"] or "unknown"
        if cat not in categories:
            categories[cat] = {"count": 0, "brand_types": {}, "price_tiers": {}}
        categories[cat]["count"] += 1
        bt = p["brand_type"] or "unknown"
        categories[cat]["brand_types"][bt] = categories[cat]["brand_types"].get(bt, 0) + 1
        pt = p["price_tier"] or "unknown"
        categories[cat]["price_tiers"][pt] = categories[cat]["price_tiers"].get(pt, 0) + 1

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period": "weekly",
        "total_products": len(products),
        "categories": categories,
        "products": products,
    }


def _generate_price_trends_csv() -> str:
    """Price aggregate trends as CSV for analytics tools."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """SELECT source, category,
                  DATE(computed_at) as date,
                  avg_price, min_price, max_price, product_count
           FROM price_aggregates
           WHERE computed_at >= NOW() - interval '30 days'
           ORDER BY date DESC, source, category"""
    )
    rows = cur.fetchall()
    cur.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["source", "category", "date", "avg_price", "min_price", "max_price", "product_count"])
    for row in rows:
        writer.writerow([
            row[0], row[1], row[2].isoformat() if row[2] else "",
            float(row[3]) if row[3] else "",
            float(row[4]) if row[4] else "",
            float(row[5]) if row[5] else "",
            row[6],
        ])

    return output.getvalue()


def _generate_alert_summary() -> dict:
    """Price alerts from the past week for the purchasing team."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """SELECT pa.id, p.name, p.brand, p.source, p.category,
                  pa.old_price, pa.new_price, pa.change_pct, pa.detected_at
           FROM price_alerts pa
           JOIN products p ON p.id = pa.product_id
           WHERE pa.detected_at >= NOW() - interval '7 days'
           ORDER BY ABS(pa.change_pct) DESC"""
    )
    rows = cur.fetchall()
    cur.close()

    alerts = []
    for row in rows:
        direction = "drop" if row[7] < 0 else "increase"
        alerts.append({
            "alert_id": row[0],
            "product_name": row[1],
            "brand": row[2],
            "source": row[3],
            "category": row[4],
            "old_price": float(row[5]) if row[5] else None,
            "new_price": float(row[6]) if row[6] else None,
            "change_pct": float(row[7]) if row[7] else None,
            "direction": direction,
            "detected_at": row[8].isoformat() if row[8] else None,
        })

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period": "weekly",
        "total_alerts": len(alerts),
        "price_drops": sum(1 for a in alerts if a["direction"] == "drop"),
        "price_increases": sum(1 for a in alerts if a["direction"] == "increase"),
        "alerts": alerts,
    }


def _generate_acquisition_report() -> dict:
    """Internal: top acquisition opportunities based on market signals."""
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """SELECT ap.acquisition_lead, ap.name_clean, ap.brand_type,
                  ap.price_tier, ap.category, ap.efficacy_signals,
                  ap.market_signals, ap.last_updated
           FROM anonymised_products ap
           WHERE ap.last_updated >= NOW() - interval '7 days'
             AND ap.acquisition_lead IS NOT NULL
           ORDER BY
               (ap.efficacy_signals->>'review_volume')::int DESC NULLS LAST,
               ap.last_updated DESC
           LIMIT 100"""
    )
    rows = cur.fetchall()
    cur.close()

    leads = []
    for row in rows:
        efficacy = row[5] or {}
        market = row[6] or {}
        leads.append({
            "acquisition_lead": row[0],
            "name_clean": row[1],
            "brand_type": row[2],
            "price_tier": row[3],
            "category": row[4],
            "review_volume": efficacy.get("review_volume", 0),
            "rating": efficacy.get("rating"),
            "bestseller": efficacy.get("bestseller", False),
            "stock_status": market.get("stock_status", "unknown"),
            "last_updated": row[7].isoformat() if row[7] else None,
        })

    return {
        "generated_at": datetime.utcnow().isoformat(),
        "period": "weekly",
        "total_leads": len(leads),
        "leads": leads,
    }
