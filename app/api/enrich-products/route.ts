import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ShopifyInput {
  id: string;
  title: string;
  vendor?: string;
  productType?: string;
  price?: number;
  handle?: string;
  tags?: string[];
  description?: string;
}

interface CatalogMatch {
  product_hash: string;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
  ingredient_summary: Record<string, number>;
  similarity: number;
}

interface EnrichmentResult {
  shopify_id: string;
  shopify_title: string;
  match: CatalogMatch | null;
  match_method: string;
  confidence: string;
  match_reasons: string[];
  price_position: string | null;
  competitor_price_avg: number | null;
  margin_opportunity: number | null;
}

/* ------------------------------------------------------------------ */
/*  Active ingredient knowledge base                                   */
/* ------------------------------------------------------------------ */

const INGREDIENT_ALIASES: Record<string, string[]> = {
  "vitamin c": ["ascorbic acid", "l-ascorbic", "ascorbyl", "ethyl ascorbic", "sodium ascorbyl"],
  retinol: ["retinal", "retinaldehyde", "retinoic", "tretinoin", "adapalene", "bakuchiol"],
  niacinamide: ["vitamin b3", "nicotinamide"],
  "hyaluronic acid": ["sodium hyaluronate", "hyaluron"],
  "salicylic acid": ["bha", "beta hydroxy"],
  "glycolic acid": ["aha", "alpha hydroxy"],
  ceramide: ["ceramides", "phytoceramide"],
  peptide: ["peptides", "matrixyl", "argireline", "copper peptide"],
  squalane: ["squalene"],
  "azelaic acid": ["azelaic"],
  centella: ["cica", "centella asiatica", "madecassoside", "asiaticoside"],
  "tranexamic acid": ["tranexamic"],
};

/** Extract normalized active keywords from text */
function extractActives(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];

  for (const [canonical, aliases] of Object.entries(INGREDIENT_ALIASES)) {
    if (lower.includes(canonical) || aliases.some((a) => lower.includes(a))) {
      found.push(canonical);
    }
  }
  return found;
}

/** Compute Jaccard similarity between two string arrays */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a.map((s) => s.toLowerCase()));
  const setB = new Set(b.map((s) => s.toLowerCase()));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/** Normalize text for comparison: lowercase, strip special chars, collapse whitespace */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Simple token-level Jaccard for name matching when pg_trgm isn't available */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = normalizeText(a).split(" ").filter(Boolean);
  const tokensB = normalizeText(b).split(" ").filter(Boolean);
  return jaccardSimilarity(tokensA, tokensB);
}

/* ------------------------------------------------------------------ */
/*  Scoring engine                                                     */
/* ------------------------------------------------------------------ */

function computeCompositeScore(
  shopify: ShopifyInput,
  catalog: CatalogMatch,
  pgSimilarity: number
): { score: number; reasons: string[]; confidence: string } {
  const reasons: string[] = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // 1. Name similarity via pg_trgm (weight: 40%)
  const nameSim = pgSimilarity;
  weightedScore += nameSim * 0.4;
  totalWeight += 0.4;
  reasons.push(`name:${nameSim.toFixed(3)}`);

  // 2. Vendor / brand match (weight: 15%)
  if (shopify.vendor && catalog.display_name) {
    const vendorLower = shopify.vendor.toLowerCase();
    const catalogLower = catalog.display_name.toLowerCase();
    if (catalogLower.includes(vendorLower) || vendorLower.includes(catalogLower.split(" ")[0] || "")) {
      weightedScore += 0.15;
      reasons.push("vendor:match");
    }
  }
  totalWeight += 0.15;

  // 3. Product type alignment (weight: 10%)
  if (shopify.productType && catalog.product_type) {
    const shopType = normalizeText(shopify.productType);
    const catType = normalizeText(catalog.product_type);
    if (shopType === catType || shopType.includes(catType) || catType.includes(shopType)) {
      weightedScore += 0.1;
      reasons.push("type:match");
    }
  }
  totalWeight += 0.1;

  // 4. Active ingredient overlap (weight: 25%)
  const shopifyActives = extractActives(
    `${shopify.title} ${shopify.description || ""} ${(shopify.tags || []).join(" ")}`
  );
  const catalogActives = (catalog.key_actives || []).map((a) =>
    a.replace(/_/g, " ").toLowerCase()
  );
  if (shopifyActives.length > 0 || catalogActives.length > 0) {
    const activeOverlap = jaccardSimilarity(shopifyActives, catalogActives);
    weightedScore += activeOverlap * 0.25;
    const shared = shopifyActives.filter((a) =>
      catalogActives.some((ca) => ca.includes(a) || a.includes(ca))
    );
    if (shared.length > 0) {
      reasons.push(`actives:${shared.length}_shared`);
    }
  }
  totalWeight += 0.25;

  // 5. Price tier alignment (weight: 10%)
  if (shopify.price && catalog.price_tier) {
    const price = shopify.price;
    const tierMatch =
      (catalog.price_tier === "budget" && price < 15) ||
      (catalog.price_tier === "mid" && price >= 15 && price < 40) ||
      (catalog.price_tier === "premium" && price >= 40 && price < 80) ||
      (catalog.price_tier === "luxury" && price >= 80);
    if (tierMatch) {
      weightedScore += 0.1;
      reasons.push("price_tier:aligned");
    }
  }
  totalWeight += 0.1;

  const finalScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const confidence =
    finalScore >= 0.7 ? "high" : finalScore >= 0.45 ? "medium" : "low";

  return { score: Math.min(finalScore, 1), reasons, confidence };
}

/* ------------------------------------------------------------------ */
/*  Price analysis                                                     */
/* ------------------------------------------------------------------ */

function analyzePricePosition(
  shopifyPrice: number | undefined,
  catalogPriceTier: string,
  efficacyScore: number | null
): { position: string | null; competitorAvg: number | null; marginOpp: number | null } {
  if (!shopifyPrice) return { position: null, competitorAvg: null, marginOpp: null };

  // Estimated competitor retail by tier (EUR, approximate from scraped data)
  const tierPriceRanges: Record<string, { low: number; mid: number; high: number }> = {
    budget: { low: 5, mid: 12, high: 20 },
    mid: { low: 15, mid: 28, high: 45 },
    premium: { low: 35, mid: 55, high: 85 },
    luxury: { low: 70, mid: 120, high: 200 },
  };

  const range = tierPriceRanges[catalogPriceTier];
  if (!range) return { position: null, competitorAvg: null, marginOpp: null };

  const competitorAvg = range.mid;

  let position: string;
  if (shopifyPrice < range.low) {
    position = "underpriced";
  } else if (shopifyPrice > range.high) {
    position = "overpriced";
  } else if (shopifyPrice < range.mid * 0.85) {
    position = "underpriced";
  } else if (shopifyPrice > range.mid * 1.15) {
    position = "overpriced";
  } else {
    position = "fair";
  }

  // If product has high efficacy and is underpriced, bigger opportunity
  const efficacyBonus = efficacyScore && efficacyScore > 4.0 ? 1.15 : 1.0;
  const marginOpp = Math.round((competitorAvg * efficacyBonus - shopifyPrice) * 100) / 100;

  return { position, competitorAvg, marginOpp };
}

/* ------------------------------------------------------------------ */
/*  POST /api/enrich-products                                          */
/*                                                                     */
/*  Body: { products: ShopifyInput[] } or auto-fetch from Shopify      */
/*  - Fetches all Shopify products via Storefront API if no products   */
/*    are provided                                                     */
/*  - For each Shopify product, runs multi-signal fuzzy matching       */
/*    against product_catalog using pg_trgm + ingredient + type        */
/*  - Stores matches in product_enrichment table                       */
/*  - Returns enrichment results with confidence & price analysis      */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode || "match"; // "match" | "auto" | "benchmark"

    // Mode: benchmark -- recompute market_benchmarks from product_catalog
    if (mode === "benchmark") {
      return await computeBenchmarks();
    }

    // Get Shopify products: either from body or fetch from Shopify API
    let shopifyProducts: ShopifyInput[] = body.products || [];

    if (shopifyProducts.length === 0 && mode === "auto") {
      // Fetch from Shopify Storefront API
      shopifyProducts = await fetchShopifyProducts();
    }

    if (shopifyProducts.length === 0) {
      return NextResponse.json(
        { status: "error", message: "No products provided. Pass products array or use mode:'auto' to fetch from Shopify." },
        { status: 400 }
      );
    }

    const results: EnrichmentResult[] = [];
    let matchCount = 0;
    let highConfidence = 0;

    for (const sp of shopifyProducts) {
      // Multi-signal matching: pg_trgm fuzzy + keyword extraction
      const candidates = await sql`
        SELECT
          product_hash,
          display_name,
          category,
          product_type,
          price_tier,
          efficacy_score,
          key_actives,
          suitable_for,
          contraindications,
          ingredient_summary,
          similarity(display_name, ${sp.title}) as sim
        FROM product_catalog
        WHERE similarity(display_name, ${sp.title}) > 0.15
           OR display_name ILIKE ${"%" + sp.title.split(" ").slice(0, 3).join("%") + "%"}
        ORDER BY similarity(display_name, ${sp.title}) DESC
        LIMIT 10
      `;

      // Also try ingredient-based matching if we got few results
      let extraCandidates: typeof candidates = [];
      const shopifyActives = extractActives(`${sp.title} ${sp.description || ""}`);
      if (candidates.length < 3 && shopifyActives.length > 0) {
        const activePatterns = shopifyActives.map((a) => a.replace(/ /g, "_"));
        extraCandidates = await sql`
          SELECT
            product_hash,
            display_name,
            category,
            product_type,
            price_tier,
            efficacy_score,
            key_actives,
            suitable_for,
            contraindications,
            ingredient_summary,
            similarity(display_name, ${sp.title}) as sim
          FROM product_catalog
          WHERE key_actives && ${activePatterns}::text[]
          ORDER BY efficacy_score DESC NULLS LAST
          LIMIT 10
        `;
      }

      // Merge and deduplicate candidates
      const allCandidates = [...candidates];
      const seenHashes = new Set(candidates.map((c) => c.product_hash));
      for (const ec of extraCandidates) {
        if (!seenHashes.has(ec.product_hash)) {
          allCandidates.push(ec);
          seenHashes.add(ec.product_hash);
        }
      }

      // Score all candidates
      let bestMatch: CatalogMatch | null = null;
      let bestScore = 0;
      let bestReasons: string[] = [];
      let bestConfidence = "low";
      let bestMethod = "fuzzy";

      for (const cand of allCandidates) {
        const catalogMatch: CatalogMatch = {
          product_hash: cand.product_hash,
          display_name: cand.display_name,
          category: cand.category,
          product_type: cand.product_type,
          price_tier: cand.price_tier,
          efficacy_score: cand.efficacy_score ? Number(cand.efficacy_score) : null,
          key_actives: cand.key_actives,
          suitable_for: cand.suitable_for,
          contraindications: cand.contraindications,
          ingredient_summary: cand.ingredient_summary || {},
          similarity: Number(cand.sim) || 0,
        };

        const { score, reasons, confidence } = computeCompositeScore(
          sp,
          catalogMatch,
          catalogMatch.similarity
        );

        // Determine match method
        let method = "fuzzy";
        if (catalogMatch.similarity > 0.8) method = "exact";
        else if (reasons.some((r) => r.startsWith("actives:"))) method = "ingredient";

        if (score > bestScore) {
          bestScore = score;
          bestMatch = catalogMatch;
          bestReasons = reasons;
          bestConfidence = confidence;
          bestMethod = method;
        }
      }

      // Price analysis
      const priceAnalysis = bestMatch
        ? analyzePricePosition(sp.price, bestMatch.price_tier, bestMatch.efficacy_score)
        : { position: null, competitorAvg: null, marginOpp: null };

      // Store in product_enrichment table if we have a match above threshold
      if (bestMatch && bestScore > 0.25) {
        matchCount++;
        if (bestConfidence === "high") highConfidence++;

        try {
          await sql`
            INSERT INTO product_enrichment (
              shopify_product_id, shopify_title, shopify_vendor,
              shopify_product_type, shopify_price, shopify_handle,
              catalog_product_hash, catalog_display_name,
              match_method, similarity_score, confidence, match_reasons,
              efficacy_score, key_actives, suitable_for, contraindications,
              ingredient_summary, competitor_price_avg, price_position,
              margin_opportunity, status, created_at, updated_at
            ) VALUES (
              ${sp.id}, ${sp.title}, ${sp.vendor || null},
              ${sp.productType || null}, ${sp.price || null}, ${sp.handle || null},
              ${bestMatch.product_hash}, ${bestMatch.display_name},
              ${bestMethod}, ${bestScore}, ${bestConfidence}, ${bestReasons},
              ${bestMatch.efficacy_score}, ${bestMatch.key_actives || []},
              ${bestMatch.suitable_for || []}, ${bestMatch.contraindications || []},
              ${JSON.stringify(bestMatch.ingredient_summary)},
              ${priceAnalysis.competitorAvg}, ${priceAnalysis.position},
              ${priceAnalysis.marginOpp},
              'pending', NOW(), NOW()
            )
            ON CONFLICT (shopify_product_id, catalog_product_hash) DO UPDATE SET
              similarity_score = EXCLUDED.similarity_score,
              confidence = EXCLUDED.confidence,
              match_reasons = EXCLUDED.match_reasons,
              efficacy_score = EXCLUDED.efficacy_score,
              key_actives = EXCLUDED.key_actives,
              suitable_for = EXCLUDED.suitable_for,
              contraindications = EXCLUDED.contraindications,
              competitor_price_avg = EXCLUDED.competitor_price_avg,
              price_position = EXCLUDED.price_position,
              margin_opportunity = EXCLUDED.margin_opportunity,
              updated_at = NOW()
          `;
        } catch (e) {
          console.error(`Failed to store enrichment for ${sp.id}:`, e);
        }
      }

      results.push({
        shopify_id: sp.id,
        shopify_title: sp.title,
        match: bestMatch && bestScore > 0.25 ? bestMatch : null,
        match_method: bestMethod,
        confidence: bestConfidence,
        match_reasons: bestReasons,
        price_position: priceAnalysis.position,
        competitor_price_avg: priceAnalysis.competitorAvg,
        margin_opportunity: priceAnalysis.marginOpp,
      });
    }

    return NextResponse.json({
      status: "success",
      total_shopify: shopifyProducts.length,
      matched: matchCount,
      high_confidence: highConfidence,
      match_rate: `${Math.round((matchCount / shopifyProducts.length) * 100)}%`,
      results,
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

/* ------------------------------------------------------------------ */
/*  GET /api/enrich-products                                           */
/*  Returns current enrichment results from the database               */
/* ------------------------------------------------------------------ */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confidence = searchParams.get("confidence"); // high, medium, low
    const status = searchParams.get("status"); // pending, approved, rejected, applied
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

    let enrichments;
    if (confidence && status) {
      enrichments = await sql`
        SELECT * FROM product_enrichment
        WHERE confidence = ${confidence} AND status = ${status}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (confidence) {
      enrichments = await sql`
        SELECT * FROM product_enrichment
        WHERE confidence = ${confidence}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else if (status) {
      enrichments = await sql`
        SELECT * FROM product_enrichment
        WHERE status = ${status}
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    } else {
      enrichments = await sql`
        SELECT * FROM product_enrichment
        ORDER BY similarity_score DESC
        LIMIT ${limit}
      `;
    }

    // Stats
    const [totalCount] = await sql`SELECT COUNT(*) as count FROM product_enrichment`;
    const confidenceCounts = await sql`
      SELECT confidence, COUNT(*) as count
      FROM product_enrichment
      GROUP BY confidence
      ORDER BY count DESC
    `;
    const statusCounts = await sql`
      SELECT status, COUNT(*) as count
      FROM product_enrichment
      GROUP BY status
      ORDER BY count DESC
    `;
    const [avgSimilarity] = await sql`
      SELECT AVG(similarity_score) as avg_sim FROM product_enrichment
    `;
    const priceCounts = await sql`
      SELECT price_position, COUNT(*) as count
      FROM product_enrichment
      WHERE price_position IS NOT NULL
      GROUP BY price_position
    `;

    return NextResponse.json({
      status: "success",
      total: parseInt(totalCount.count),
      avg_similarity: avgSimilarity.avg_sim
        ? Number(Number(avgSimilarity.avg_sim).toFixed(4))
        : 0,
      by_confidence: confidenceCounts,
      by_status: statusCounts,
      by_price_position: priceCounts,
      enrichments,
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

/* ------------------------------------------------------------------ */
/*  Fetch Shopify products via Storefront API                          */
/* ------------------------------------------------------------------ */

async function fetchShopifyProducts(): Promise<ShopifyInput[]> {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!domain || !token) return [];

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const endpoint = `https://${cleanDomain}/api/2024-01/graphql.json`;

  const allProducts: ShopifyInput[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const query = `
      query ($first: Int!, $after: String, $country: CountryCode) @inContext(country: $country) {
        products(first: $first, after: $after) {
          edges {
            node {
              id
              title
              vendor
              productType
              handle
              tags
              description
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query,
        variables: { first: 50, after: cursor, country: "DE" },
      }),
    });

    const data = await res.json();
    const edges = data?.data?.products?.edges || [];

    for (const edge of edges) {
      const node = edge.node;
      allProducts.push({
        id: node.id,
        title: node.title,
        vendor: node.vendor,
        productType: node.productType,
        handle: node.handle,
        tags: node.tags,
        description: node.description,
        price: node.priceRange?.minVariantPrice?.amount
          ? parseFloat(node.priceRange.minVariantPrice.amount)
          : undefined,
      });
      cursor = edge.cursor;
    }

    hasNextPage = data?.data?.products?.pageInfo?.hasNextPage || false;
  }

  return allProducts;
}

/* ------------------------------------------------------------------ */
/*  PATCH /api/enrich-products                                         */
/*  Update enrichment status (approve/reject) + optionally push to     */
/*  Shopify via Admin API (metafields + price)                         */
/* ------------------------------------------------------------------ */

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // --- Bulk status update ---
    if (action === "bulk_status") {
      const { ids, status: newStatus } = body as {
        ids: number[];
        status: string;
      };
      if (!ids?.length || !newStatus) {
        return NextResponse.json(
          { status: "error", message: "ids[] and status required" },
          { status: 400 }
        );
      }
      await sql`
        UPDATE product_enrichment
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ANY(${ids})
      `;
      return NextResponse.json({
        status: "success",
        updated: ids.length,
        new_status: newStatus,
      });
    }

    // --- Single status update ---
    if (action === "update_status") {
      const { id, status: newStatus } = body as {
        id: number;
        status: string;
      };
      await sql`
        UPDATE product_enrichment
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${id}
      `;
      return NextResponse.json({ status: "success", id, new_status: newStatus });
    }

    // --- Adjust prices to match benchmarks ---
    if (action === "adjust_prices") {
      const SHOPIFY_STORE =
        process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(
          /\/$/,
          ""
        );
      const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

      if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
        return NextResponse.json(
          { status: "error", message: "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN required" },
          { status: 400 }
        );
      }

      console.log("[v0] Price adjust - SHOPIFY_STORE:", SHOPIFY_STORE);
      console.log("[v0] Price adjust - Token length:", SHOPIFY_ADMIN_TOKEN.length, "starts with:", SHOPIFY_ADMIN_TOKEN.slice(0, 6));

      // First test if token has read access - use same pattern as connection-test
      // connection-test uses the raw SHOPIFY_STORE_DOMAIN which may include the protocol
      const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || "";
      const testUrl = `https://${SHOPIFY_STORE}/admin/api/2024-01/products.json?limit=1&fields=id,variants`;
      console.log("[v0] Price adjust test URL:", testUrl);
      const testRes = await fetch(testUrl, {
        headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
      });
      console.log("[v0] Price adjust test response:", testRes.status);
      if (!testRes.ok) {
        const errBody = await testRes.text();
        console.log("[v0] Price adjust test error body:", errBody.slice(0, 300));
        return NextResponse.json({
          status: "error",
          message: `Admin API not accessible (HTTP ${testRes.status}). Store: ${SHOPIFY_STORE}, Raw domain: ${rawDomain}, Token starts: ${SHOPIFY_ADMIN_TOKEN.slice(0, 6)}..., Response: ${errBody.slice(0, 150)}`,
        }, { status: 400 });
      }
      const testData = await testRes.json();
      const testProduct = testData?.products?.[0];
      if (testProduct) {
        // Try a no-op write to check write_products scope
        const writeTestUrl = `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${testProduct.id}.json`;
        const writeRes = await fetch(writeTestUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
          },
          body: JSON.stringify({
            product: { id: testProduct.id },
          }),
        });
        if (writeRes.status === 403) {
          return NextResponse.json({
            status: "error",
            message: "SHOPIFY_ADMIN_TOKEN does not have write_products permission. Go to Shopify Admin > Settings > Apps and sales channels > Develop apps, select your app, and add the write_products scope.",
          }, { status: 403 });
        }
      }

      // ids is optional -- if provided, only adjust those; otherwise adjust all overpriced
      const { ids, strategy } = body as {
        ids?: number[];
        strategy?: "match_avg" | "undercut_5" | "undercut_10";
      };
      const priceStrategy = strategy || "match_avg";

      // Get enrichments that have price data
      let rows;
      if (ids?.length) {
        rows = await sql`
          SELECT * FROM product_enrichment
          WHERE id = ANY(${ids})
            AND competitor_price_avg IS NOT NULL
            AND shopify_price IS NOT NULL
        `;
      } else {
        rows = await sql`
          SELECT * FROM product_enrichment
          WHERE (status = 'approved' OR status = 'applied')
            AND competitor_price_avg IS NOT NULL
            AND shopify_price IS NOT NULL
            AND price_position = 'overpriced'
        `;
      }

      if (rows.length === 0) {
        return NextResponse.json({
          status: "success",
          message: "No products with price data to adjust",
          adjusted: 0,
        });
      }

      let adjusted = 0;
      let failed = 0;
      const results: Array<{
        title: string;
        old_price: number;
        new_price: number;
        status: string;
      }> = [];
      const errors: string[] = [];

      console.log("[v0] Price adjust starting. Store:", SHOPIFY_STORE, "Token set:", !!SHOPIFY_ADMIN_TOKEN, "Rows:", rows.length);

      for (const row of rows) {
        try {
          const shopifyId = row.shopify_product_id?.replace(
            "gid://shopify/Product/",
            ""
          );

          console.log("[v0] Processing:", row.shopify_title, "ID:", row.shopify_product_id, "->", shopifyId);

          if (!shopifyId || shopifyId === row.shopify_product_id) {
            // ID wasn't a GID format, try using it directly
            console.log("[v0] ID not in GID format, using raw:", row.shopify_product_id);
          }

          const currentPrice = Number(row.shopify_price);
          const competitorAvg = Number(row.competitor_price_avg);

          // Calculate new price based on strategy
          let newPrice: number;
          switch (priceStrategy) {
            case "undercut_5":
              newPrice = competitorAvg * 0.95;
              break;
            case "undercut_10":
              newPrice = competitorAvg * 0.90;
              break;
            case "match_avg":
            default:
              newPrice = competitorAvg;
              break;
          }

          // Round to 2 decimal places
          newPrice = Math.round(newPrice * 100) / 100;

          // Skip if price would increase for overpriced items or barely changes
          if (Math.abs(newPrice - currentPrice) < 0.50) {
            results.push({
              title: row.shopify_title,
              old_price: currentPrice,
              new_price: newPrice,
              status: "skipped_minimal_change",
            });
            continue;
          }

          // Use the numeric ID (strip GID prefix if present)
          const numericId = shopifyId || row.shopify_product_id;

          // First get the product's variants to find variant IDs
          const productUrl = `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${numericId}.json?fields=id,variants`;
          console.log("[v0] Fetching product:", productUrl);
          const productRes = await fetch(productUrl, {
            headers: { "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN },
          });

          if (!productRes.ok) {
            const errBody = await productRes.text();
            console.log("[v0] Product fetch failed:", productRes.status, errBody.slice(0, 200));
            failed++;
            results.push({
              title: row.shopify_title,
              old_price: currentPrice,
              new_price: newPrice,
              status: `error_${productRes.status}`,
            });
            errors.push(`${row.shopify_title}: HTTP ${productRes.status} - ${errBody.slice(0, 100)}`);
            continue;
          }

          const productData = await productRes.json();
          const variants = productData?.product?.variants || [];
          console.log("[v0] Found", variants.length, "variants for", row.shopify_title);

          if (variants.length === 0) {
            failed++;
            results.push({
              title: row.shopify_title,
              old_price: currentPrice,
              new_price: newPrice,
              status: "no_variants",
            });
            errors.push(`${row.shopify_title}: No variants found`);
            continue;
          }

          // Update price via product endpoint (sets all variants at once)
          const updateUrl = `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${numericId}.json`;
          const updatedVariants = variants.map((v: { id: number }) => ({
            id: v.id,
            price: String(newPrice),
            compare_at_price: String(currentPrice),
          }));
          const updateRes = await fetch(updateUrl, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
            },
            body: JSON.stringify({
              product: {
                id: Number(numericId),
                variants: updatedVariants,
              },
            }),
          });
          const variantUpdated = updateRes.ok;
          if (!variantUpdated) {
            const errBody = await updateRes.text();
            console.log("[v0] Price update failed:", updateRes.status, errBody.slice(0, 200));
          }

          // Rate limit: wait 500ms between Shopify API calls to avoid 429
          await new Promise((resolve) => setTimeout(resolve, 500));

          if (variantUpdated) {
            adjusted++;
            results.push({
              title: row.shopify_title,
              old_price: currentPrice,
              new_price: newPrice,
              status: "adjusted",
            });
            // Update the enrichment record
            await sql`
              UPDATE product_enrichment
              SET shopify_price = ${newPrice},
                  price_position = 'fair',
                  updated_at = NOW()
              WHERE id = ${row.id}
            `;
          } else {
            failed++;
            errors.push(`${row.shopify_title}: Variant update failed`);
          }
        } catch (e) {
          failed++;
          errors.push(
            `${row.shopify_title}: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      return NextResponse.json({
        status: "success",
        total: rows.length,
        adjusted,
        failed,
        skipped: rows.length - adjusted - failed,
        strategy: priceStrategy,
        results: results.slice(0, 20),
        errors: errors.slice(0, 10),
      });
    }

    // --- Push approved enrichments to Shopify ---
    if (action === "push_to_shopify") {
      const SHOPIFY_STORE =
        process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "").replace(
          /\/$/,
          ""
        );
      const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

      if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
        return NextResponse.json(
          {
            status: "error",
            message:
              "SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN required for push",
          },
          { status: 400 }
        );
      }

      // Get all approved enrichments that haven't been applied yet
      const approved = await sql`
        SELECT * FROM product_enrichment
        WHERE status = 'approved'
        ORDER BY similarity_score DESC
      `;

      if (approved.length === 0) {
        return NextResponse.json({
          status: "success",
          message: "No approved enrichments to push",
          pushed: 0,
        });
      }

      let pushed = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const row of approved) {
        try {
          // Extract Shopify numeric ID from GID
          const shopifyId = row.shopify_product_id.replace(
            "gid://shopify/Product/",
            ""
          );

          // Build metafields for enrichment data
          const metafields: Array<{
            namespace: string;
            key: string;
            value: string;
            type: string;
          }> = [];

          if (row.efficacy_score != null) {
            metafields.push({
              namespace: "crazygels",
              key: "efficacy_score",
              value: String(row.efficacy_score),
              type: "number_decimal",
            });
          }
          if (row.key_actives?.length) {
            metafields.push({
              namespace: "crazygels",
              key: "key_actives",
              value: JSON.stringify(row.key_actives),
              type: "json",
            });
          }
          if (row.suitable_for?.length) {
            metafields.push({
              namespace: "crazygels",
              key: "suitable_for",
              value: JSON.stringify(row.suitable_for),
              type: "json",
            });
          }
          if (row.contraindications?.length) {
            metafields.push({
              namespace: "crazygels",
              key: "contraindications",
              value: JSON.stringify(row.contraindications),
              type: "json",
            });
          }
          if (row.catalog_product_hash) {
            metafields.push({
              namespace: "crazygels",
              key: "catalog_match",
              value: row.catalog_product_hash,
              type: "single_line_text_field",
            });
          }
          if (row.confidence) {
            metafields.push({
              namespace: "crazygels",
              key: "match_confidence",
              value: row.confidence,
              type: "single_line_text_field",
            });
          }
          if (row.price_position) {
            metafields.push({
              namespace: "crazygels",
              key: "price_position",
              value: row.price_position,
              type: "single_line_text_field",
            });
          }
          if (row.competitor_price_avg != null) {
            metafields.push({
              namespace: "crazygels",
              key: "competitor_price_avg",
              value: String(row.competitor_price_avg),
              type: "number_decimal",
            });
          }

          // Push metafields to Shopify Admin API
          const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/products/${shopifyId}.json`;
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
            },
            body: JSON.stringify({
              product: {
                id: Number(shopifyId),
                metafields,
                // Add enrichment tags
                tags: row.key_actives?.length
                  ? [
                      "bio-enriched",
                      ...row.key_actives.slice(0, 5),
                    ].join(", ")
                  : "bio-enriched",
              },
            }),
          });

          if (res.ok) {
            pushed++;
            // Mark as applied in DB
            await sql`
              UPDATE product_enrichment
              SET status = 'applied', updated_at = NOW()
              WHERE id = ${row.id}
            `;
          } else {
            failed++;
            const errText = await res.text();
            errors.push(
              `${row.shopify_title}: ${res.status} - ${errText.slice(0, 100)}`
            );
          }
        } catch (e) {
          failed++;
          errors.push(
            `${row.shopify_title}: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      }

      return NextResponse.json({
        status: "success",
        total_approved: approved.length,
        pushed,
        failed,
        errors: errors.slice(0, 10),
      });
    }

    return NextResponse.json(
      { status: "error", message: `Unknown action: ${action}` },
      { status: 400 }
    );
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

/* ------------------------------------------------------------------ */
/*  Compute market benchmarks                                          */
/* ------------------------------------------------------------------ */

async function computeBenchmarks() {
  try {
    // Aggregate benchmarks per product_type + price_tier
    const benchmarks = await sql`
      SELECT
        product_type,
        price_tier,
        ROUND(AVG(efficacy_score), 2) as avg_efficacy,
        COUNT(*) as product_count
      FROM product_catalog
      WHERE product_type IS NOT NULL AND price_tier IS NOT NULL
      GROUP BY product_type, price_tier
      HAVING COUNT(*) >= 2
    `;

    let upserted = 0;
    for (const b of benchmarks) {
      // Get top actives for this segment
      const actives = await sql`
        SELECT UNNEST(key_actives) as active, COUNT(*) as cnt
        FROM product_catalog
        WHERE product_type = ${b.product_type} AND price_tier = ${b.price_tier}
        GROUP BY active
        ORDER BY cnt DESC
        LIMIT 5
      `;

      // Get top concerns
      const concerns = await sql`
        SELECT UNNEST(suitable_for) as concern, COUNT(*) as cnt
        FROM product_catalog
        WHERE product_type = ${b.product_type} AND price_tier = ${b.price_tier}
        GROUP BY concern
        ORDER BY cnt DESC
        LIMIT 5
      `;

      await sql`
        INSERT INTO market_benchmarks (
          product_type, price_tier, avg_efficacy, product_count,
          top_actives, top_concerns, computed_at
        ) VALUES (
          ${b.product_type}, ${b.price_tier},
          ${b.avg_efficacy}, ${parseInt(b.product_count)},
          ${actives.map((a) => a.active)},
          ${concerns.map((c) => c.concern)},
          NOW()
        )
        ON CONFLICT (product_type, price_tier) DO UPDATE SET
          avg_efficacy = EXCLUDED.avg_efficacy,
          product_count = EXCLUDED.product_count,
          top_actives = EXCLUDED.top_actives,
          top_concerns = EXCLUDED.top_concerns,
          computed_at = NOW()
      `;
      upserted++;
    }

    return NextResponse.json({
      status: "success",
      benchmarks_computed: upserted,
      segments: benchmarks,
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
