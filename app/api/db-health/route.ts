import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  try {
    const [countResult] = await sql`SELECT COUNT(*) as count FROM product_catalog`;
    const sampleResult = await sql`SELECT * FROM product_catalog LIMIT 1`;

    return NextResponse.json({
      status: "connected",
      product_count: parseInt(countResult.count),
      sample_product: sampleResult[0] || null,
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
