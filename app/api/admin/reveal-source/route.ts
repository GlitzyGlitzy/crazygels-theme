import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

/**
 * POST /api/admin/reveal-source
 *
 * Decrypts and returns the source intelligence for a given acquisition lead.
 * This is the "reveal" action from the demand table -- shows where to buy,
 * wholesale contacts, MOQ, lead times, etc.
 *
 * Body: { acquisition_lead: string }
 * Protected by ADMIN_TOKEN header.
 */

function verifyAdmin(req: NextRequest): boolean {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  return token === process.env.ADMIN_TOKEN;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { acquisition_lead } = await req.json();

  if (!acquisition_lead) {
    return NextResponse.json(
      { error: "acquisition_lead is required" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT
        si.acquisition_lead,
        si.product_hash,
        si.supplier_contacts,
        si.wholesale_price,
        si.moq,
        si.lead_time_days,
        si.sample_ordered,
        si.sample_status,
        si.listed_on_shopify,
        si.shopify_product_id,
        si.last_purchased,
        si.margin_actual,
        si.created_at,
        si.updated_at,
        pc.display_name,
        pc.category,
        pc.price_tier,
        pc.efficacy_score,
        pc.key_actives
      FROM source_intelligence si
      LEFT JOIN product_catalog pc ON pc.product_hash = si.product_hash
      WHERE si.acquisition_lead = $1`,
      [acquisition_lead]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Source not found for this acquisition lead" },
        { status: 404 }
      );
    }

    const source = result.rows[0];

    // Compute estimated margin if wholesale price exists
    const estimatedMargin =
      source.wholesale_price && source.price_tier
        ? computeEstimatedMargin(source.wholesale_price, source.price_tier)
        : null;

    return NextResponse.json({
      ...source,
      estimated_margin: estimatedMargin,
      revealed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[reveal-source] Error:", error);
    return NextResponse.json(
      { error: "Failed to reveal source" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

function computeEstimatedMargin(
  wholesalePrice: number,
  priceTier: string
): number {
  // Estimated retail prices by tier
  const retailEstimates: Record<string, number> = {
    budget: wholesalePrice * 2.5,
    mid: wholesalePrice * 3,
    premium: wholesalePrice * 3.5,
    luxury: wholesalePrice * 4,
  };

  const estimatedRetail = retailEstimates[priceTier] || wholesalePrice * 3;
  return parseFloat(
    (((estimatedRetail - wholesalePrice) / estimatedRetail) * 100).toFixed(1)
  );
}
