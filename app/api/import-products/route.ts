import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

/**
 * POST /api/import-products
 *
 * Accepts scraped product JSON (from sephora/amazon scraper output or
 * the combined_intelligence.json format) and imports into the
 * product_catalog table via the promote_to_catalog logic.
 *
 * Body: { products: [...] } or [...] (array of anonymised products)
 */

// Ingredient -> concern mapping (mirrors promote_to_catalog.py)
const ACTIVE_CONCERN_MAP: Record<string, { concerns: string[]; group: string }> = {
  niacinamide: { concerns: ["acne", "hyperpigmentation", "aging"], group: "actives" },
  "vitamin c": { concerns: ["hyperpigmentation", "aging", "dullness"], group: "actives" },
  "ascorbic acid": { concerns: ["hyperpigmentation", "aging", "dullness"], group: "actives" },
  retinol: { concerns: ["aging", "acne", "texture"], group: "actives" },
  retinal: { concerns: ["aging", "acne", "texture"], group: "actives" },
  "salicylic acid": { concerns: ["acne", "blackheads", "oily"], group: "actives" },
  "hyaluronic acid": { concerns: ["dehydration", "dryness", "aging"], group: "humectants" },
  "glycolic acid": { concerns: ["texture", "dullness", "aging"], group: "actives" },
  "lactic acid": { concerns: ["texture", "dryness", "sensitivity"], group: "actives" },
  "azelaic acid": { concerns: ["acne", "rosacea", "hyperpigmentation"], group: "actives" },
  ceramide: { concerns: ["dryness", "sensitivity", "barrier_repair"], group: "emollients" },
  peptide: { concerns: ["aging", "firmness"], group: "actives" },
  squalane: { concerns: ["dryness", "sensitivity"], group: "emollients" },
  zinc: { concerns: ["acne", "oily", "sensitivity"], group: "actives" },
  centella: { concerns: ["sensitivity", "redness", "barrier_repair"], group: "actives" },
  "tea tree": { concerns: ["acne", "oily"], group: "actives" },
  bakuchiol: { concerns: ["aging", "sensitivity"], group: "actives" },
  "tranexamic acid": { concerns: ["hyperpigmentation", "melasma"], group: "actives" },
  arbutin: { concerns: ["hyperpigmentation", "dullness"], group: "actives" },
  urea: { concerns: ["dryness", "texture"], group: "humectants" },
  panthenol: { concerns: ["sensitivity", "barrier_repair"], group: "humectants" },
  "snail mucin": { concerns: ["aging", "dehydration", "texture"], group: "humectants" },
  propolis: { concerns: ["acne", "sensitivity"], group: "actives" },
  collagen: { concerns: ["aging", "firmness"], group: "humectants" },
  aloe: { concerns: ["sensitivity", "hydration"], group: "humectants" },
};

const CONTRA_MAP: Record<string, string[]> = {
  retinol: ["pregnancy", "sensitive_skin_severe"],
  retinal: ["pregnancy", "sensitive_skin_severe"],
  "salicylic acid": ["pregnancy"],
  "benzoyl peroxide": ["fungal_acne"],
  "glycolic acid": ["sensitive_skin_severe"],
};

const CATEGORY_TYPE_MAP: Record<string, string> = {
  "skincare-serums": "serum",
  "skincare-moisturizers": "moisturizer",
  "skincare-cleansers": "cleanser",
  "skincare-toners": "toner",
  "skincare-masks": "mask",
  "hair-shampoo": "shampoo",
  "nail-polish": "nail_polish",
  fragrances: "fragrance",
};

const TYPE_DEFAULTS: Record<string, string[]> = {
  serum: ["general_skincare"],
  moisturizer: ["dryness", "dehydration"],
  cleanser: ["general_skincare"],
  toner: ["general_skincare"],
  mask: ["general_skincare"],
  shampoo: ["general_haircare"],
  nail_polish: ["nail_care"],
  fragrance: ["general_fragrance"],
};

interface AnonymisedProduct {
  product_hash: string;
  source?: string;
  category?: string;
  name_clean?: string;
  brand_type?: string;
  price_tier?: string;
  efficacy_signals?: {
    rating?: number | null;
    review_count?: number | null;
    has_ingredients?: boolean;
  };
  ingredient_profile?: {
    actives?: string[];
    notable?: string[];
  };
  market_signals?: Record<string, unknown>;
  acquisition_lead?: string;
  last_updated?: string;
}

function promoteProduct(anon: AnonymisedProduct) {
  const name = anon.name_clean || "";
  const category = (anon.category || "").replace(/_/g, "-");
  const productType =
    CATEGORY_TYPE_MAP[category] ||
    (category ? category.split("-").pop() : "unknown") ||
    "unknown";

  const nameLower = name.toLowerCase();
  const keyActives: string[] = [];
  const suitableFor = new Set<string>();
  const contraindications = new Set<string>();
  const ingredientSummary: Record<string, number> = {
    actives: 0,
    humectants: 0,
    emollients: 0,
  };

  for (const [active, info] of Object.entries(ACTIVE_CONCERN_MAP)) {
    if (nameLower.includes(active)) {
      keyActives.push(active.replace(/ /g, "_"));
      info.concerns.forEach((c) => suitableFor.add(c));
      ingredientSummary[info.group] = (ingredientSummary[info.group] || 0) + 1;
    }
  }

  for (const [active, contras] of Object.entries(CONTRA_MAP)) {
    if (nameLower.includes(active)) {
      contras.forEach((c) => contraindications.add(c));
    }
  }

  if (suitableFor.size === 0) {
    const defaults = TYPE_DEFAULTS[productType] || ["general"];
    defaults.forEach((d) => suitableFor.add(d));
  }

  const efficacy = anon.efficacy_signals || {};
  const efficacyScore =
    efficacy.rating != null && String(efficacy.rating) !== "null"
      ? Number(efficacy.rating)
      : null;

  return {
    product_hash: anon.product_hash,
    display_name: (name || `Unknown ${productType}`).slice(0, 255),
    category,
    product_type: productType,
    price_tier: anon.price_tier || "unknown",
    efficacy_score: efficacyScore,
    review_signals: "stable",
    key_actives: keyActives,
    ingredient_summary: ingredientSummary,
    suitable_for: Array.from(suitableFor),
    contraindications: Array.from(contraindications),
    status: "research",
    acquisition_lead: anon.acquisition_lead || null,
    source: anon.source || "unknown",
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Accept either { products: [...] } or [...] directly
    const rawProducts: AnonymisedProduct[] = Array.isArray(body)
      ? body
      : body.products || [];

    if (rawProducts.length === 0) {
      return NextResponse.json(
        { status: "error", message: "No products provided" },
        { status: 400 }
      );
    }

    // Deduplicate by product_hash
    const seen = new Set<string>();
    const unique: AnonymisedProduct[] = [];
    for (const p of rawProducts) {
      if (p.product_hash && !seen.has(p.product_hash)) {
        seen.add(p.product_hash);
        unique.push(p);
      }
    }

    // Promote and insert
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const anon of unique) {
      try {
        const entry = promoteProduct(anon);

        const result = await sql`
          INSERT INTO product_catalog (
            product_hash, display_name, category, product_type, price_tier,
            efficacy_score, review_signals, key_actives, ingredient_summary,
            suitable_for, contraindications, status, acquisition_lead, source,
            created_at, updated_at
          ) VALUES (
            ${entry.product_hash},
            ${entry.display_name},
            ${entry.category},
            ${entry.product_type},
            ${entry.price_tier},
            ${entry.efficacy_score},
            ${entry.review_signals},
            ${entry.key_actives},
            ${JSON.stringify(entry.ingredient_summary)},
            ${entry.suitable_for},
            ${entry.contraindications},
            ${entry.status},
            ${entry.acquisition_lead},
            ${entry.source},
            NOW(),
            NOW()
          )
          ON CONFLICT (product_hash) DO UPDATE SET
            efficacy_score = COALESCE(EXCLUDED.efficacy_score, product_catalog.efficacy_score),
            price_tier = CASE
              WHEN EXCLUDED.price_tier != 'unknown' THEN EXCLUDED.price_tier
              ELSE product_catalog.price_tier
            END,
            key_actives = COALESCE(EXCLUDED.key_actives, product_catalog.key_actives),
            suitable_for = COALESCE(EXCLUDED.suitable_for, product_catalog.suitable_for),
            updated_at = NOW()
          RETURNING (xmax = 0) as is_insert
        `;

        if (result[0]?.is_insert) {
          inserted++;
        } else {
          updated++;
        }
      } catch (e) {
        errors.push(
          `${anon.product_hash}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // Also insert into anonymised_products table
    let anonInserted = 0;
    for (const anon of unique) {
      try {
        await sql`
          INSERT INTO anonymised_products (
            product_hash, category, name_clean, brand_type, price_tier,
            efficacy_signals, ingredient_profile, market_signals,
            acquisition_lead, last_updated
          ) VALUES (
            ${anon.product_hash},
            ${anon.category || null},
            ${anon.name_clean || null},
            ${anon.brand_type || null},
            ${anon.price_tier || null},
            ${JSON.stringify(anon.efficacy_signals || {})},
            ${JSON.stringify(anon.ingredient_profile || {})},
            ${JSON.stringify(anon.market_signals || {})},
            ${anon.acquisition_lead || null},
            NOW()
          )
          ON CONFLICT (product_hash) DO UPDATE SET
            category = EXCLUDED.category,
            name_clean = EXCLUDED.name_clean,
            brand_type = EXCLUDED.brand_type,
            price_tier = EXCLUDED.price_tier,
            efficacy_signals = EXCLUDED.efficacy_signals,
            ingredient_profile = EXCLUDED.ingredient_profile,
            market_signals = EXCLUDED.market_signals,
            acquisition_lead = EXCLUDED.acquisition_lead,
            last_updated = NOW()
        `;
        anonInserted++;
      } catch {
        // Silently skip duplicates in anonymised table
      }
    }

    return NextResponse.json({
      status: "success",
      product_catalog: { inserted, updated, errors: errors.length },
      anonymised_products: { inserted: anonInserted },
      total_processed: unique.length,
      error_details: errors.length > 0 ? errors.slice(0, 10) : undefined,
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

// GET: Return current product catalog stats
export async function GET() {
  try {
    const [catalogCount] = await sql`SELECT COUNT(*) as count FROM product_catalog`;
    const [anonCount] = await sql`SELECT COUNT(*) as count FROM anonymised_products`;

    const categoryCounts = await sql`
      SELECT category, COUNT(*) as count
      FROM product_catalog
      GROUP BY category
      ORDER BY count DESC
    `;

    const sourceCounts = await sql`
      SELECT source, COUNT(*) as count
      FROM product_catalog
      GROUP BY source
      ORDER BY count DESC
    `;

    const recentProducts = await sql`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, source, created_at
      FROM product_catalog
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({
      status: "connected",
      product_catalog: parseInt(catalogCount.count),
      anonymised_products: parseInt(anonCount.count),
      by_category: categoryCounts,
      by_source: sourceCounts,
      recent: recentProducts,
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
