import { NextResponse } from "next/server";
import crypto from "crypto";

// This endpoint initiates the Shopify OAuth flow
// Visit /api/shopify-auth to start the installation/re-authorization
export async function GET() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const shop = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!clientId || !shop) {
    return NextResponse.json({
      error: "Missing SHOPIFY_CLIENT_ID or SHOPIFY_STORE_DOMAIN. Set these in your Vercel Vars first.",
    }, { status: 400 });
  }

  // The callback URL must match what's configured in the Shopify app
  // Build the redirect URI from the deployment URL
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null)
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/shopify-auth/callback`;

  // Generate a random nonce for security
  const nonce = crypto.randomBytes(16).toString("hex");

  // Scopes matching what we configured in the app
  const scopes = [
    "read_products",
    "write_products",
    "read_inventory",
    "write_inventory",
    "read_product_listings",
    "write_product_listings",
    "read_price_rules",
    "write_price_rules",
    "read_content",
    "write_content",
  ].join(",");

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;

  return NextResponse.redirect(installUrl);
}
