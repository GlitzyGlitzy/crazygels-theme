import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

function verifyAdmin(req: NextRequest): boolean {
  const token =
    req.headers.get("authorization")?.replace("Bearer ", "") ||
    req.headers.get("x-admin-token");
  return token === process.env.ADMIN_TOKEN;
}

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildSeoTitle(name: string, category: string): string {
  const base = `${name} | ${category} | Crazy Gels`;
  return base.length <= 60 ? base : `${name} | Crazy Gels`.slice(0, 60);
}

function buildSeoDescription(name: string, actives: string[], priceTier: string): string {
  const activePart = actives.length > 0 ? ` With ${actives.slice(0, 3).join(", ")}.` : "";
  const tierMap: Record<string, string> = {
    luxury: "Luxury",
    premium: "Premium",
    mid: "Mid-range",
    budget: "Affordable",
  };
  const tier = tierMap[priceTier] || "";
  return `${tier} ${name}.${activePart} Shop now at Crazy Gels.`.trim().slice(0, 155);
}

const GOOGLE_CATEGORIES: Record<string, string> = {
  skincare: "Health & Beauty > Personal Care > Skin Care",
  serums: "Health & Beauty > Personal Care > Skin Care > Facial Serums",
  moisturizers: "Health & Beauty > Personal Care > Skin Care > Moisturizers",
  toners: "Health & Beauty > Personal Care > Skin Care > Toners",
  face_masks: "Health & Beauty > Personal Care > Skin Care > Facial Masks",
  haircare: "Health & Beauty > Personal Care > Hair Care",
  shampoo_conditioner: "Health & Beauty > Personal Care > Hair Care",
  nail_care: "Health & Beauty > Personal Care > Cosmetics > Nail Care",
  fragrances: "Health & Beauty > Personal Care > Fragrances",
};

export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT
        sd.product_hash,
        sd.retail_price,
        sd.initial_quantity,
        sd.fulfillment_method,
        sd.priority,
        sd.notes,
        pc.display_name,
        pc.category,
        pc.product_type,
        pc.price_tier,
        pc.efficacy_score,
        pc.key_actives,
        pc.suitable_for,
        pc.image_url,
        pc.source
      FROM stocking_decisions sd
      JOIN product_catalog pc ON sd.product_hash = pc.product_hash
      WHERE sd.decision = 'stock'
      ORDER BY
        CASE sd.priority
          WHEN 'urgent' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
          ELSE 5
        END,
        pc.display_name ASC
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No stocked products to export. Mark products as 'Stock' first." },
        { status: 404 }
      );
    }

    // Shopify CSV headers
    const headers = [
      "Handle",
      "Title",
      "Body (HTML)",
      "Vendor",
      "Product Category",
      "Type",
      "Tags",
      "Published",
      "Option1 Name",
      "Option1 Value",
      "Option2 Name",
      "Option2 Value",
      "Option3 Name",
      "Option3 Value",
      "Variant SKU",
      "Variant Grams",
      "Variant Inventory Tracker",
      "Variant Inventory Policy",
      "Variant Fulfillment Service",
      "Variant Price",
      "Variant Compare At Price",
      "Variant Requires Shipping",
      "Variant Taxable",
      "Variant Barcode",
      "Image Src",
      "Image Position",
      "Image Alt Text",
      "Gift Card",
      "SEO Title",
      "SEO Description",
      "Google Shopping / Google Product Category",
      "Google Shopping / Gender",
      "Google Shopping / Age Group",
      "Google Shopping / MPN",
      "Google Shopping / Condition",
      "Google Shopping / Custom Product",
      "Google Shopping / Custom Label 0",
      "Google Shopping / Custom Label 1",
      "Variant Image",
      "Variant Weight Unit",
      "Variant Tax Code",
      "Cost per item",
      "Included / International",
      "Included / United States",
      "Price / International",
      "Price / United States",
      "Compare At Price / International",
      "Compare At Price / United States",
      "Status",
    ];

    const csvRows: string[][] = [];

    for (const p of rows) {
      const name = p.display_name as string;
      const handle = toHandle(name);
      const category = (p.category as string) || "skincare";
      const productType = (p.product_type as string) || category;
      const actives = (p.key_actives as string[]) || [];
      const suitableFor = (p.suitable_for as string[]) || [];
      const priceTier = (p.price_tier as string) || "mid";
      const retailPrice = p.retail_price ? Number(p.retail_price).toFixed(2) : "";
      const imageUrl = (p.image_url as string) || "";
      const efficacy = p.efficacy_score != null ? `${Math.round(Number(p.efficacy_score) * 100)}%` : "";
      const source = (p.source as string) || "";

      // Build body HTML
      const activesHtml = actives.length > 0
        ? `<p><strong>Key Actives:</strong> ${actives.join(", ")}</p>`
        : "";
      const suitableHtml = suitableFor.length > 0
        ? `<p><strong>Best For:</strong> ${suitableFor.join(", ")}</p>`
        : "";
      const efficacyHtml = efficacy
        ? `<p><strong>Efficacy Score:</strong> ${efficacy}</p>`
        : "";
      const bodyHtml = `${activesHtml}${suitableHtml}${efficacyHtml}`;

      // Build tags
      const tags = [
        category,
        priceTier,
        ...actives.slice(0, 5),
        ...(suitableFor.length > 0 ? suitableFor.slice(0, 3) : []),
        source ? `source:${source}` : "",
      ].filter(Boolean).join(", ");

      const googleCategory = GOOGLE_CATEGORIES[category.toLowerCase()] ||
        GOOGLE_CATEGORIES[productType.toLowerCase()] ||
        "Health & Beauty > Personal Care > Skin Care";

      const seoTitle = buildSeoTitle(name, category);
      const seoDescription = buildSeoDescription(name, actives, priceTier);

      const row = [
        handle,                          // Handle
        name,                            // Title
        bodyHtml,                        // Body (HTML)
        "Crazy Gels",                    // Vendor
        googleCategory,                  // Product Category
        productType,                     // Type
        tags,                            // Tags
        "FALSE",                         // Published (draft)
        "Title",                         // Option1 Name
        "Default Title",                 // Option1 Value
        "",                              // Option2 Name
        "",                              // Option2 Value
        "",                              // Option3 Name
        "",                              // Option3 Value
        `CG-${(p.product_hash as string).slice(0, 8).toUpperCase()}`, // Variant SKU
        "0",                             // Variant Grams
        "shopify",                       // Variant Inventory Tracker
        "deny",                          // Variant Inventory Policy
        "manual",                        // Variant Fulfillment Service
        retailPrice,                     // Variant Price
        "",                              // Variant Compare At Price
        "TRUE",                          // Variant Requires Shipping
        "TRUE",                          // Variant Taxable
        "",                              // Variant Barcode
        imageUrl,                        // Image Src
        imageUrl ? "1" : "",             // Image Position
        imageUrl ? name : "",            // Image Alt Text
        "FALSE",                         // Gift Card
        seoTitle,                        // SEO Title
        seoDescription,                  // SEO Description
        googleCategory,                  // Google Shopping Category
        "Unisex",                        // Google Shopping Gender
        "Adult",                         // Google Shopping Age Group
        `CG-${(p.product_hash as string).slice(0, 8).toUpperCase()}`, // Google MPN
        "New",                           // Google Condition
        "",                              // Google Custom Product
        priceTier,                       // Google Custom Label 0
        productType,                     // Google Custom Label 1
        "",                              // Variant Image
        "g",                             // Variant Weight Unit
        "",                              // Variant Tax Code
        "",                              // Cost per item
        "TRUE",                          // Included / International
        "TRUE",                          // Included / United States
        retailPrice,                     // Price / International
        retailPrice,                     // Price / United States
        "",                              // Compare At Price / International
        "",                              // Compare At Price / United States
        "draft",                         // Status
      ];

      csvRows.push(row);
    }

    const csvLines = [
      headers.map(csvEscape).join(","),
      ...csvRows.map((row) => row.map(csvEscape).join(",")),
    ];
    const csvContent = csvLines.join("\n");

    const now = new Date().toISOString().split("T")[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="crazygels-stocked-products-${now}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[stocking-csv] Export error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV", details: String(error) },
      { status: 500 }
    );
  }
}
