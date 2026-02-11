import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "research";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const sortBy = searchParams.get("sort") || "efficacy";

    const orderSql =
      sortBy === "votes"
        ? sql`COALESCE(pc.vote_count, 0) DESC`
        : sortBy === "recommendations"
          ? sql`COALESCE(pc.recommendation_count, 0) DESC`
          : sql`pc.efficacy_score DESC NULLS LAST`;

    const rows = await sql`
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
      WHERE pc.status = ${status}
      ORDER BY ${orderSql}
      LIMIT ${limit}`;

    const stats = {
      total: rows.length,
      with_source: rows.filter((r: Record<string, unknown>) => r.has_source).length,
      high_demand: rows.filter((r: Record<string, unknown>) => r.demand_tier === "high").length,
      avg_efficacy:
        rows.length > 0
          ? (
              rows.reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.efficacy_score) || 0), 0) /
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
  }
}
