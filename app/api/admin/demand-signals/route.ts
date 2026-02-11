import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * GET /api/admin/demand-signals
 *
 * Returns products from product_catalog ranked by demand signals:
 * - recommendation_count (how often the product appears in recommendations)
 * - vote_count (community votes from the RecommendationGrid)
 * - efficacy_score (our computed score from scraped review data)
 *
 * Protected by ADMIN_TOKEN header.
 */

function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "research";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const sortBy = searchParams.get("sort") || "efficacy";

    const orderClause =
      sortBy === "votes"
        ? "COALESCE(pc.vote_count, 0) DESC"
        : sortBy === "recommendations"
          ? "COALESCE(pc.recommendation_count, 0) DESC"
          : "pc.efficacy_score DESC NULLS LAST";

    const result = await client.query(
      `SELECT
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
        COALESCE(pc.recommendation_count, 0) as recommendation_count,
        COALESCE(pc.vote_count, 0) as vote_count,
        CASE
          WHEN pc.efficacy_score >= 0.8 THEN 'high'
          WHEN pc.efficacy_score >= 0.6 THEN 'medium'
          ELSE 'low'
        END as demand_tier,
        si.acquisition_lead,
        CASE WHEN si.acquisition_lead IS NOT NULL THEN true ELSE false END as has_source,
        si.sample_ordered,
        si.sample_status,
        si.listed_on_shopify,
        si.wholesale_price,
        si.moq,
        si.lead_time_days,
        si.margin_actual
      FROM product_catalog pc
      LEFT JOIN source_intelligence si ON si.product_hash = pc.product_hash
      WHERE pc.status = $1
      ORDER BY ${orderClause}
      LIMIT $2`,
      [status, limit]
    );

    // Compute aggregate stats
    const rows = result.rows;
    const stats = {
      total: rows.length,
      with_source: rows.filter((r: { has_source: boolean }) => r.has_source).length,
      high_demand: rows.filter((r: { demand_tier: string }) => r.demand_tier === "high").length,
      avg_efficacy:
        rows.length > 0
          ? (
              rows.reduce((sum: number, r: { efficacy_score: number | null }) => sum + (r.efficacy_score || 0), 0) /
              rows.length
            ).toFixed(2)
          : 0,
    };

    return NextResponse.json({ signals: rows, stats });
  } catch (error) {
    console.error("[demand-signals] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch demand signals" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
