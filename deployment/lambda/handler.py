"""Lambda handlers for data processing and export generation."""

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


def _get_db_connection():
    """Get database connection using Secrets Manager credentials."""
    client = boto3.client("secretsmanager")
    secret = json.loads(
        client.get_secret_value(SecretId=os.environ["DB_SECRET_ARN"])["SecretString"]
    )
    return psycopg2.connect(
        host=secret["host"],
        port=secret["port"],
        dbname=secret["database"],
        user=secret["username"],
        password=secret["password"],
        sslmode="require",
    )


def process(event, context):
    """Daily data processing: aggregate prices, detect changes, flag anomalies."""
    logger.info("Starting daily data processing")
    conn = _get_db_connection()

    try:
        with conn.cursor() as cur:
            # 1. Compute daily price averages per category
            cur.execute("""
                INSERT INTO price_aggregates (source, category, avg_price, min_price, max_price,
                                              product_count, computed_at)
                SELECT
                    p.source,
                    p.category,
                    AVG(ph.price) as avg_price,
                    MIN(ph.price) as min_price,
                    MAX(ph.price) as max_price,
                    COUNT(DISTINCT p.id) as product_count,
                    NOW()
                FROM products p
                JOIN price_history ph ON p.id = ph.product_id
                WHERE ph.scraped_at >= NOW() - INTERVAL '24 hours'
                GROUP BY p.source, p.category
                ON CONFLICT (source, category, DATE(computed_at))
                DO UPDATE SET
                    avg_price = EXCLUDED.avg_price,
                    min_price = EXCLUDED.min_price,
                    max_price = EXCLUDED.max_price,
                    product_count = EXCLUDED.product_count
            """)

            # 2. Detect significant price drops (>15%) for competitive alerts
            cur.execute("""
                INSERT INTO price_alerts (product_id, old_price, new_price, change_pct, detected_at)
                SELECT
                    ph_new.product_id,
                    ph_old.price as old_price,
                    ph_new.price as new_price,
                    ((ph_new.price - ph_old.price) / ph_old.price * 100) as change_pct,
                    NOW()
                FROM price_history ph_new
                JOIN LATERAL (
                    SELECT price
                    FROM price_history ph2
                    WHERE ph2.product_id = ph_new.product_id
                      AND ph2.scraped_at < ph_new.scraped_at
                    ORDER BY ph2.scraped_at DESC
                    LIMIT 1
                ) ph_old ON TRUE
                WHERE ph_new.scraped_at >= NOW() - INTERVAL '24 hours'
                  AND ABS((ph_new.price - ph_old.price) / NULLIF(ph_old.price, 0) * 100) > 15
            """)

            # 3. Flag out-of-stock competitor products (opportunity for Crazy Gels)
            cur.execute("""
                UPDATE products
                SET tags = tags || '["competitor_out_of_stock"]'::jsonb
                WHERE id IN (
                    SELECT DISTINCT p.id
                    FROM products p
                    JOIN price_history ph ON p.id = ph.product_id
                    WHERE ph.scraped_at >= NOW() - INTERVAL '24 hours'
                      AND ph.in_stock = FALSE
                      AND NOT (p.tags @> '["competitor_out_of_stock"]'::jsonb)
                )
            """)

            conn.commit()
            logger.info("Daily processing complete")

            return {"statusCode": 200, "body": "Processing complete"}
    except Exception as e:
        conn.rollback()
        logger.error(f"Processing failed: {e}")
        raise
    finally:
        conn.close()


def export_data(event, context):
    """Weekly export: generate CSV reports and upload to S3."""
    logger.info("Starting weekly export generation")
    conn = _get_db_connection()
    s3 = boto3.client("s3")
    bucket = os.environ["EXPORT_BUCKET"]

    try:
        with conn.cursor() as cur:
            today = datetime.utcnow().strftime("%Y-%m-%d")

            # 1. Price comparison report
            cur.execute("""
                SELECT
                    p.source, p.name, p.brand, p.category, p.url,
                    ph.price, ph.currency, ph.sale_price, ph.in_stock,
                    p.rating, p.review_count
                FROM products p
                JOIN LATERAL (
                    SELECT * FROM price_history ph2
                    WHERE ph2.product_id = p.id
                    ORDER BY ph2.scraped_at DESC LIMIT 1
                ) ph ON TRUE
                ORDER BY p.category, p.source, ph.price
            """)
            rows = cur.fetchall()
            columns = [
                "source", "name", "brand", "category", "url",
                "price", "currency", "sale_price", "in_stock",
                "rating", "review_count",
            ]

            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(columns)
            for row in rows:
                writer.writerow(row)

            s3.put_object(
                Bucket=bucket,
                Key=f"reports/{today}/price-comparison.csv",
                Body=output.getvalue().encode("utf-8"),
                ContentType="text/csv",
            )
            logger.info(f"Exported {len(rows)} rows to price-comparison.csv")

            # 2. Category averages JSON
            cur.execute("""
                SELECT source, category, avg_price, min_price, max_price, product_count
                FROM price_aggregates
                WHERE computed_at >= NOW() - INTERVAL '7 days'
                ORDER BY category, source
            """)
            agg_rows = cur.fetchall()
            agg_data = [
                {
                    "source": r[0], "category": r[1],
                    "avg_price": float(r[2]), "min_price": float(r[3]),
                    "max_price": float(r[4]), "product_count": r[5],
                }
                for r in agg_rows
            ]

            s3.put_object(
                Bucket=bucket,
                Key=f"reports/{today}/category-averages.json",
                Body=json.dumps(agg_data, indent=2).encode("utf-8"),
                ContentType="application/json",
            )

            return {"statusCode": 200, "body": f"Exported {len(rows)} products"}
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise
    finally:
        conn.close()
