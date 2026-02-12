import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    rds_host: process.env.RDS_HOST ? `${process.env.RDS_HOST.slice(0, 20)}...` : "NOT SET",
    rds_port: process.env.RDS_PORT || "5432 (default)",
    rds_database: process.env.RDS_DATABASE || "crazygels (default)",
    rds_user: process.env.RDS_USER || "admin_crazygels (default)",
    rds_password: process.env.RDS_PASSWORD ? "SET (hidden)" : "NOT SET",
    rds_ssl: process.env.RDS_SSL ?? "require (default)",
  };

  try {
    // Step 1: Basic connectivity test
    const start = Date.now();
    const [pingResult] = await sql`SELECT 1 as ping, current_database() as db, version() as version`;
    const latency = Date.now() - start;

    diagnostics.ping = "OK";
    diagnostics.latency_ms = latency;
    diagnostics.database = pingResult.db;
    diagnostics.pg_version = pingResult.version?.split(",")[0];

    // Step 2: Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    diagnostics.tables = tables.map((t: { table_name: string }) => t.table_name);

    // Step 3: Count product_catalog if it exists
    let productCount = 0;
    let sampleProduct = null;
    const hasProductCatalog = tables.some(
      (t: { table_name: string }) => t.table_name === "product_catalog"
    );
    if (hasProductCatalog) {
      const [countResult] = await sql`SELECT COUNT(*) as count FROM product_catalog`;
      productCount = parseInt(countResult.count);
      const sampleResult = await sql`SELECT * FROM product_catalog LIMIT 1`;
      sampleProduct = sampleResult[0] || null;
    }

    return NextResponse.json({
      status: "connected",
      product_count: productCount,
      sample_product: sampleProduct,
      diagnostics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    // Categorize the error for easier debugging
    let hint = "";
    if (message.includes("CONNECT_TIMEOUT") || message.includes("timeout")) {
      hint =
        "Connection timed out. Check: (1) RDS security group allows inbound from your IP on port 5432, (2) RDS instance is publicly accessible, (3) RDS_HOST is correct.";
    } else if (message.includes("password authentication")) {
      hint =
        "Wrong credentials. Check RDS_USER and RDS_PASSWORD match the database user.";
    } else if (message.includes("does not exist")) {
      hint =
        "Database or table not found. Check RDS_DATABASE name or run Setup Tables first.";
    } else if (message.includes("SSL") || message.includes("ssl")) {
      hint =
        'SSL handshake failed. Try setting RDS_SSL=false in your .env.local if your RDS does not enforce SSL.';
    } else if (message.includes("ENOTFOUND")) {
      hint =
        "DNS resolution failed. The RDS_HOST hostname is not reachable. Check the endpoint in the AWS console.";
    }

    return NextResponse.json(
      {
        status: "error",
        message,
        hint,
        diagnostics,
      },
      { status: 500 }
    );
  }
}
