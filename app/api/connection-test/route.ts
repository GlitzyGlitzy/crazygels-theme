import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
  const results: Record<string, { status: string; detail?: string }> = {};

  // 1. Database (Neon / RDS)
  try {
    const rows = await sql`SELECT NOW() AS ts`;
    results.database = { status: "OK", detail: `Connected — server time ${rows[0].ts}` };
  } catch (e: unknown) {
    results.database = { status: "ERROR", detail: e instanceof Error ? e.message : String(e) };
  }

  // 2. Shopify Storefront API
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const sfToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
    if (!domain || !sfToken) {
      results.shopify_storefront = {
        status: "MISSING",
        detail: `SHOPIFY_STORE_DOMAIN=${domain ? "set" : "missing"}, SHOPIFY_STOREFRONT_ACCESS_TOKEN=${sfToken ? "set" : "missing"}`,
      };
    } else {
      const res = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": sfToken,
        },
        body: JSON.stringify({ query: `{ shop { name } }` }),
      });
      if (!res.ok) {
        results.shopify_storefront = { status: "ERROR", detail: `HTTP ${res.status}: ${await res.text()}` };
      } else {
        const json = await res.json();
        results.shopify_storefront = { status: "OK", detail: `Shop: ${json.data?.shop?.name}` };
      }
    }
  } catch (e: unknown) {
    results.shopify_storefront = { status: "ERROR", detail: e instanceof Error ? e.message : String(e) };
  }

  // 3. Shopify Admin API
  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const adminToken = process.env.SHOPIFY_ADMIN_TOKEN;
    if (!domain || !adminToken) {
      results.shopify_admin = {
        status: "MISSING",
        detail: `SHOPIFY_STORE_DOMAIN=${domain ? "set" : "missing"}, SHOPIFY_ADMIN_TOKEN=${adminToken ? "set" : "missing"}`,
      };
    } else {
      const res = await fetch(`https://${domain}/admin/api/2024-01/shop.json`, {
        headers: { "X-Shopify-Access-Token": adminToken },
      });
      if (!res.ok) {
        const body = await res.text();
        results.shopify_admin = { status: "ERROR", detail: `HTTP ${res.status}: ${body}` };
      } else {
        const json = await res.json();
        results.shopify_admin = { status: "OK", detail: `Shop: ${json.shop?.name} (${json.shop?.plan_name})` };
      }
    }
  } catch (e: unknown) {
    results.shopify_admin = { status: "ERROR", detail: e instanceof Error ? e.message : String(e) };
  }

  // 4. Klaviyo
  try {
    const pubKey = process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY;
    const privKey = process.env.KLAVIYO_PRIVATE_API_KEY;
    if (!pubKey && !privKey) {
      results.klaviyo = { status: "MISSING", detail: "No Klaviyo keys set" };
    } else {
      results.klaviyo = {
        status: privKey ? "OK" : "PARTIAL",
        detail: `Public key: ${pubKey ? "set" : "missing"}, Private key: ${privKey ? "set" : "missing"}`,
      };
    }
  } catch (e: unknown) {
    results.klaviyo = { status: "ERROR", detail: e instanceof Error ? e.message : String(e) };
  }

  // 5. Admin Token
  results.admin_token = process.env.ADMIN_TOKEN
    ? { status: "OK", detail: "ADMIN_TOKEN is set" }
    : { status: "MISSING", detail: "ADMIN_TOKEN not set — /admin pages won't authenticate" };

  // Summary
  const allOk = Object.values(results).every((r) => r.status === "OK");
  const missingCount = Object.values(results).filter((r) => r.status === "MISSING" || r.status === "ERROR").length;

  return NextResponse.json({
    ok: allOk,
    results,
    ...(missingCount > 0 ? {
      setup_hint: "Missing env vars? Run: npx vercel login && npx vercel link && npx vercel env pull .env.local -- or copy .env.example to .env.local and fill in values manually.",
    } : {}),
  }, { status: allOk ? 200 : 207 });
}
