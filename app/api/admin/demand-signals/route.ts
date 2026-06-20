import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyAdmin, unauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "research";
    const limit = Math.min(parseInt(searchParams.get("limit") || "2000"), 5000);
    const sortBy = searchParams.get("sort") || "efficacy";

    const orderSql =
      sortBy === "efficacy"
        ? sql`efficacy_score DESC NULLS LAST`
        : sql`updated_at DESC NULLS LAST`;

    const rows = await sql`
      WITH scored AS (
        SELECT
          pc.product_hash,
          pc.display_name,
          pc.category,
          pc.product_type,
          pc.price_tier,
          pc.efficacy_score,
          pc.review_signals,
          pc.key_actives,
          pc.suitable_for,
          pc.contraindications,
          pc.status,
          pc.created_at,
          pc.updated_at,
          pc.acquisition_lead,
          pc.source,
          pc.image_url,
          pc.retail_price,
          pc.currency,
          pc.source_url,
          COALESCE(array_length(pc.key_actives, 1), 0) as active_count,
          CASE
            WHEN (ap.efficacy_signals->>'review_count') ~ '^[0-9]+$'
              THEN (ap.efficacy_signals->>'review_count')::int
            ELSE 0
          END as review_count,
          CASE
            WHEN (ap.efficacy_signals->>'rating') ~ '^[0-9]+([.][0-9]+)?$'
              THEN (ap.efficacy_signals->>'rating')::numeric
            ELSE NULL
          END as rating,
          CASE WHEN pc.acquisition_lead IS NOT NULL THEN true ELSE false END as has_source
        FROM product_catalog pc
        LEFT JOIN anonymised_products ap ON ap.product_hash = pc.product_hash
        WHERE pc.status = ${status}
      )
      SELECT
        scored.*,
        CASE
          WHEN efficacy_score >= 0.75 THEN 'high'
          WHEN efficacy_score >= 0.5 THEN 'medium'
          ELSE 'low'
        END as efficacy_tier,
        CASE
          WHEN review_count >= 1000 THEN 'high'
          WHEN review_count >= 100 THEN 'medium'
          WHEN review_count > 0 THEN 'low'
          ELSE 'unknown'
        END as market_demand_tier,
        CASE
          WHEN active_count >= 3 THEN 'strong'
          WHEN active_count >= 1 THEN 'partial'
          ELSE 'weak'
        END as ingredient_match_tier,
        CASE
          WHEN review_count >= 500 AND rating >= 4.2 THEN 'high'
          WHEN review_count >= 50 AND rating >= 3.8 THEN 'medium'
          WHEN review_count > 0 OR rating IS NOT NULL THEN 'low'
          ELSE 'unknown'
        END as review_confidence_tier,
        CASE
          WHEN efficacy_score >= 0.75 THEN 'high'
          WHEN efficacy_score >= 0.5 THEN 'medium'
          ELSE 'low'
        END as demand_tier
      FROM scored
      ORDER BY ${orderSql}
      LIMIT ${limit}`;

    // Enrichment stats across entire catalog (not just filtered)
    let e = { total: '0', has_price: '0', has_image: '0', complete: '0', listed: '0' };
    try {
      const enrichmentStats = await sql<{
        total: string;
        has_price: string;
        has_image: string;
        complete: string;
        listed: string;
      }[]>`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN retail_price IS NOT NULL AND retail_price > 0 THEN 1 END) as has_price,
          COUNT(CASE WHEN image_url IS NOT NULL THEN 1 END) as has_image,
          COUNT(CASE WHEN retail_price > 0 AND image_url IS NOT NULL THEN 1 END) as complete,
          COUNT(CASE WHEN status = 'listed' THEN 1 END) as listed
        FROM product_catalog
      `;
      if (enrichmentStats[0]) e = enrichmentStats[0];
    } catch (err) {
      console.error("[demand-signals] Enrichment stats query failed:", err);
    }

    const stats = {
      total: rows.length,
      with_source: rows.filter((r: Record<string, unknown>) => r.has_source).length,
      high_demand: rows.filter((r: Record<string, unknown>) => r.efficacy_tier === "high").length,
      high_formula_evidence: rows.filter((r: Record<string, unknown>) => r.efficacy_tier === "high").length,
      high_market_demand: rows.filter((r: Record<string, unknown>) => r.market_demand_tier === "high").length,
      avg_efficacy:
        rows.length > 0
          ? (
              rows.reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.efficacy_score) || 0), 0) /
              rows.length
            ).toFixed(2)
          : 0,
      catalog_total: Number(e.total),
      enriched_price: Number(e.has_price),
      enriched_image: Number(e.has_image),
      enriched_complete: Number(e.complete),
      listed_on_shopify: Number(e.listed),
    };

    return NextResponse.json({ signals: rows, stats });
  } catch (error) {
    console.error("[demand-signals] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demand signals" },
      { status: 500 }
    );
  }
}
