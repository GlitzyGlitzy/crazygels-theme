import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

function verifyAdmin(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.headers.get("x-admin-token");
  return token === process.env.ADMIN_TOKEN;
}

/* ── GET: fetch all stocking decisions with product catalog data ── */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
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
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    } = body;

    if (!product_hash) {
      return NextResponse.json(
        { error: "product_hash is required" },
        { status: 400 }
      );
    }

    console.log("[v0] stocking upsert:", { product_hash, decision, retail_price, initial_quantity, fulfillment_method, priority });

    // Upsert: insert or update if already exists
    const rows = await sql`
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

    // If decision is 'stock', also update product_catalog status to 'listed'
    if (decision === "stock") {
      await sql`
        UPDATE product_catalog
        SET status = 'listed', updated_at = NOW()
        WHERE product_hash = ${product_hash}
      `;
    }

    return NextResponse.json({ success: true, decision: rows[0] });
  } catch (error) {
    console.error("[stocking] POST error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to save stocking decision: ${message}` },
      { status: 500 }
    );
  }
}
