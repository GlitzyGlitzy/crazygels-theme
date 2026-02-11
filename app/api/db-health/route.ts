import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const client = await pool.connect();

    const result = await client.query(
      "SELECT COUNT(*) as count FROM product_catalog"
    );
    const sample = await client.query("SELECT * FROM product_catalog LIMIT 1");

    client.release();

    return NextResponse.json({
      status: "connected",
      product_count: parseInt(result.rows[0].count),
      sample_product: sample.rows[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
