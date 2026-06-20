import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { verifyAdmin, unauthorized } from "@/lib/admin-auth";

/* ── GET: fetch stocking decisions or unstocked catalog products ── */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    // mode=unstocked — catalog products with no stocking_decisions row
    if (mode === "unstocked") {
      const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);
      const rows = await sql`
        SELECT
          pc.product_hash,
          pc.display_name,
          pc.category,
          pc.price_tier,
          pc.efficacy_score,
          pc.key_actives,
          pc.suitable_for,
          pc.status,
          CASE
            WHEN pc.efficacy_score >= 0.3 THEN 'high'
            WHEN pc.efficacy_score >= 0.15 THEN 'medium'
            ELSE 'low'
          END as demand_tier,
          CASE WHEN pc.acquisition_lead IS NOT NULL THEN true ELSE false END as has_source
        FROM product_catalog pc
        LEFT JOIN stocking_decisions sd ON pc.product_hash = sd.product_hash
        WHERE sd.product_hash IS NULL
          AND pc.status IN ('research', 'sampled')
        ORDER BY pc.efficacy_score DESC NULLS LAST
        LIMIT ${limit}
      `;
      return NextResponse.json({ products: rows, total: rows.length });
    }

    const decision = searchParams.get("decision") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "200"), 500);

    const rows = await sql`
      SELECT
        sd.*,
        pc.display_name,
        pc.category,
        pc.product_type,
        pc.price_tier,
        pc.efficacy_score,
        pc.key_actives,
        pc.suitable_for,
        pc.contraindications,
        pc.review_signals,
        pc.source,
        pc.image_url
      FROM stocking_decisions sd
      JOIN product_catalog pc ON sd.product_hash = pc.product_hash
      ${decision !== "all" ? sql`WHERE sd.decision = ${decision}` : sql``}
      ORDER BY
        CASE sd.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        sd.updated_at DESC
      LIMIT ${limit}
    `;

    // Stats
    const statsRows = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE decision = 'stock') as stock_count,
        COUNT(*) FILTER (WHERE decision = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE decision = 'watchlist') as watchlist_count,
        COUNT(*) FILTER (WHERE decision = 'reject') as reject_count,
        COUNT(*) FILTER (WHERE priority = 'urgent' OR priority = 'high') as high_priority
      FROM stocking_decisions
    `;

    return NextResponse.json({ decisions: rows, stats: statsRows[0] });
  } catch (error) {
    console.error("[stocking] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stocking decisions" },
      { status: 500 }
    );
  }
}

/* ── POST: create or update a stocking decision ── */
export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  try {
    const body = await req.json();
    console.log("[v0] stocking POST body:", JSON.stringify(body));
    const {
      product_hash,
      decision = "pending",
      retail_price,
      initial_quantity,
      fulfillment_method = "in_house",
      priority = "medium",
      notes,
      skip_existing = false,
    } = body;

    if (!product_hash) {
      return NextResponse.json(
        { error: "product_hash is required" },
        { status: 400 }
      );
    }

    console.log("[v0] stocking upsert:", { product_hash, decision, retail_price, initial_quantity, fulfillment_method, priority, skip_existing });

    const rows = skip_existing
      ? await sql`
          INSERT INTO stocking_decisions (
            product_hash, decision, retail_price, initial_quantity,
            fulfillment_method, priority, notes
          ) VALUES (
            ${product_hash}, ${decision}, ${retail_price || null},
            ${initial_quantity || null}, ${fulfillment_method},
            ${priority}, ${notes || null}
          )
          ON CONFLICT (product_hash) DO NOTHING
          RETURNING *
        `
      : await sql`
          INSERT INTO stocking_decisions (
            product_hash, decision, retail_price, initial_quantity,
            fulfillment_method, priority, notes
          ) VALUES (
            ${product_hash}, ${decision}, ${retail_price || null},
            ${initial_quantity || null}, ${fulfillment_method},
            ${priority}, ${notes || null}
          )
          ON CONFLICT (product_hash) DO UPDATE SET
            decision = EXCLUDED.decision,
            retail_price = COALESCE(EXCLUDED.retail_price, stocking_decisions.retail_price),
            initial_quantity = COALESCE(EXCLUDED.initial_quantity, stocking_decisions.initial_quantity),
            fulfillment_method = EXCLUDED.fulfillment_method,
            priority = EXCLUDED.priority,
            notes = EXCLUDED.notes,
            updated_at = NOW()
          RETURNING *
        `;

    // rows.length === 0 means DO NOTHING fired (row already existed)
    const skipped = rows.length === 0;

    if (!skipped && decision === "stock") {
      await sql`
        UPDATE product_catalog
        SET status = 'listed', updated_at = NOW()
        WHERE product_hash = ${product_hash}
      `;
    }

    return NextResponse.json({ success: true, skipped, decision: rows[0] ?? null });
  } catch (error) {
    console.error("[stocking] POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to save stocking decision: ${message}` },
      { status: 500 }
    );
  }
}
