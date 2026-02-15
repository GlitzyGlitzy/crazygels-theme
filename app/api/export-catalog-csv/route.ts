import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { buildSeoTitle, buildSeoDescription } from "@/lib/seo";

/**
 * GET /api/export-catalog-csv
 *
 * Exports enriched products from product_catalog (DB) as a Shopify-compatible CSV.
 * Only exports products that have a price set (enriched).
 * Use ?status=research to export research products, or ?status=all for all.
 *
 * This is different from /api/export-products-csv which exports EXISTING Shopify products.
 * This endpoint exports SCRAPED products from the intelligence DB that are NOT yet on Shopify.
 */

function verifyAdmin(req: NextRequest): boolean {
  const token =
    req.headers.get("x-admin-token") ||
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    new URL(req.url).searchParams.get("token");
  return token === process.env.ADMIN_TOKEN;
}

interface CatalogProduct {
  product_hash: string;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
  image_url: string | null;
  description_generated: string | null;
  retail_price: number | null;
  currency: string | null;
  source: string | null;
  status: string;
}

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Same Google categories as the Shopify export
const GOOGLE_CATEGORIES: Record<string, string> = {
  skincare: "Health & Beauty > Personal Care > Skin Care",
  "skin care": "Health & Beauty > Personal Care > Skin Care",
  haircare: "Health & Beauty > Personal Care > Hair Care",
  "hair care": "Health & Beauty > Personal Care > Hair Care",
  fragrance: "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne",
  nails: "Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories",
  treatments: "Health & Beauty > Personal Care > Skin Care",
};

const SHOPIFY_CSV_HEADERS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags",
  "Published", "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value",
  "Option3 Name", "Option3 Value", "Variant SKU", "Variant Grams",
  "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy",
  "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price",
  "Variant Requires Shipping", "Variant Taxable", "Variant Barcode",
  "Image Src", "Image Position", "Image Alt Text", "Gift Card",
  "SEO Title", "SEO Description",
  "Google Shopping / Google Product Category", "Google Shopping / Gender",
  "Google Shopping / Age Group", "Google Shopping / MPN", "Google Shopping / Condition",
  "Google Shopping / Custom Product", "Google Shopping / Custom Label 0",
  "Google Shopping / Custom Label 1", "Variant Image", "Variant Weight Unit",
  "Variant Tax Code", "Cost per item",
  "Included / International", "Included / United States",
  "Price / International", "Price / United States",
  "Compare At Price / International", "Compare At Price / United States",
  "Status",
];

const COL: Record<string, number> = {};
SHOPIFY_CSV_HEADERS.forEach((h, i) => { COL[h] = i; });

function emptyRow(): string[] {
  return new Array(SHOPIFY_CSV_HEADERS.length).fill("");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function generateDescription(p: CatalogProduct): string {
  const activesHtml =
    p.key_actives && p.key_actives.length > 0
      ? `<h3>Key Actives</h3><ul>${p.key_actives
          .map((a) => `<li>${a.charAt(0).toUpperCase() + a.slice(1)}</li>`)
          .join("")}</ul>`
      : "";

  const suitableHtml =
    p.suitable_for && p.suitable_for.length > 0
      ? `<p><strong>Best for:</strong> ${p.suitable_for.join(", ")} skin</p>`
      : "";

  return `
    <div class="cg-product-intel">
      <h2>Bio-Optimised by Crazy Gels Intelligence</h2>
      <p>Our system analysed thousands of skin profiles and reviews,
      scoring this formula <strong>${Math.round((p.efficacy_score || 0) * 100)}% efficacy</strong>
      across verified sources.</p>
      ${activesHtml}
      ${suitableHtml}
      <p><em>Selected by algorithm. Validated by community. Delivered by Crazy Gels.</em></p>
    </div>
  `.trim();
}

function buildProductRow(p: CatalogProduct): string[] {
  const handle = slugify(p.display_name);
  const price = p.retail_price ? Number(p.retail_price).toFixed(2) : "0.00";
  const typeKey = (p.category || "").toLowerCase().trim();
  const googleCategory = GOOGLE_CATEGORIES[typeKey] || "Health & Beauty > Personal Care";
  const bodyHtml = p.description_generated || generateDescription(p);
  const priceStr = `$${price}`;
  const seoTitle = buildSeoTitle(p.display_name, p.category);
  const seoDescription = buildSeoDescription(p.display_name, "", p.category, priceStr);

  const tags = [
    "bio-optimised",
    "ai-curated",
    p.price_tier,
    ...(p.key_actives || []),
    ...(p.suitable_for || []).map((s) => `skin-${s}`),
  ].filter(Boolean).join(", ");

  const row = emptyRow();
  row[COL["Handle"]] = handle;
  row[COL["Title"]] = p.display_name;
  row[COL["Body (HTML)"]] = bodyHtml;
  row[COL["Vendor"]] = "Crazy Gels Select";
  row[COL["Product Category"]] = googleCategory;
  row[COL["Type"]] = p.category || "";
  row[COL["Tags"]] = tags;
  row[COL["Published"]] = "false"; // Draft
  row[COL["Option1 Name"]] = "Title";
  row[COL["Option1 Value"]] = "Default Title";
  row[COL["Variant SKU"]] = p.product_hash.slice(0, 16);
  row[COL["Variant Grams"]] = "0";
  row[COL["Variant Inventory Tracker"]] = "shopify";
  row[COL["Variant Inventory Qty"]] = "0";
  row[COL["Variant Inventory Policy"]] = "deny";
  row[COL["Variant Fulfillment Service"]] = "manual";
  row[COL["Variant Price"]] = price;
  row[COL["Variant Requires Shipping"]] = "true";
  row[COL["Variant Taxable"]] = "true";
  row[COL["Gift Card"]] = "FALSE";
  row[COL["SEO Title"]] = seoTitle;
  row[COL["SEO Description"]] = seoDescription;
  row[COL["Google Shopping / Google Product Category"]] = googleCategory;
  row[COL["Google Shopping / Gender"]] = "Unisex";
  row[COL["Google Shopping / Age Group"]] = "Adult";
  row[COL["Google Shopping / MPN"]] = p.product_hash.slice(0, 16);
  row[COL["Google Shopping / Condition"]] = "New";
  row[COL["Google Shopping / Custom Label 0"]] = p.price_tier;
  row[COL["Google Shopping / Custom Label 1"]] = p.category || "";
  row[COL["Variant Weight Unit"]] = "g";
  row[COL["Included / International"]] = "TRUE";
  row[COL["Included / United States"]] = "TRUE";
  row[COL["Price / International"]] = price;
  row[COL["Price / United States"]] = price;
  row[COL["Status"]] = "draft";

  // Image
  if (p.image_url) {
    row[COL["Image Src"]] = p.image_url;
    row[COL["Image Position"]] = "1";
    row[COL["Image Alt Text"]] = p.display_name;
    row[COL["Variant Image"]] = p.image_url;
  }

  return row;
}

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "research";

    // Only export products that have prices
    const whereClause = status === "all"
      ? sql`retail_price IS NOT NULL AND retail_price > 0`
      : sql`retail_price IS NOT NULL AND retail_price > 0 AND status = ${status}`;

    const products = await sql<CatalogProduct[]>`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, key_actives, suitable_for, contraindications,
             image_url, description_generated, retail_price, currency, source, status
      FROM product_catalog
      WHERE ${whereClause}
      ORDER BY efficacy_score DESC NULLS LAST
    `;

    if (products.length === 0) {
      return NextResponse.json(
        { error: "No enriched products to export. Run enrichment first via /admin/intelligence." },
        { status: 404 }
      );
    }

    const allRows = products.map(buildProductRow);

    const csvLines = [
      SHOPIFY_CSV_HEADERS.map(csvEscape).join(","),
      ...allRows.map((row) => row.map(csvEscape).join(",")),
    ];
    const BOM = "\uFEFF";
    const csvContent = BOM + csvLines.join("\n");

    const now = new Date().toISOString().split("T")[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="crazygels-catalog-products-${now}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[export-catalog-csv] Error:", error);
    return NextResponse.json(
      { error: "Failed to export catalog", details: String(error) },
      { status: 500 }
    );
  }
}
