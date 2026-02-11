import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { skinProfile } = await req.json();

    if (!skinProfile?.concerns || !Array.isArray(skinProfile.concerns)) {
      return NextResponse.json(
        { error: "skinProfile.concerns is required (string array)" },
        { status: 400 }
      );
    }

    const matches = await findMatches(skinProfile);
    const blended = blendRecommendations(matches);

    return NextResponse.json(blended);
  } catch (error) {
    console.error("[recommendations] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

interface SkinProfile {
  concerns: string[];
  sensitivities?: string[];
  priceTier?: string;
  category?: string;
}

interface CatalogProduct {
  product_hash: string;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number | null;
  review_signals: string;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  image_url: string | null;
  description_generated: string | null;
  status: string;
}

async function findMatches(
  skinProfile: SkinProfile
): Promise<CatalogProduct[]> {
  const concerns = skinProfile.concerns;
  const sensitivities = skinProfile.sensitivities || [];
  const priceTier = skinProfile.priceTier;
  const category = skinProfile.category;

  let result: CatalogProduct[];

  if (priceTier && category) {
    result = await sql<CatalogProduct[]>`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, review_signals, key_actives, suitable_for,
             image_url, description_generated, status
      FROM product_catalog
      WHERE suitable_for && ${concerns}
        AND status IN ('listed', 'sampled', 'research')
        AND NOT (contraindications && ${sensitivities})
        AND price_tier = ${priceTier}
        AND product_type = ${category}
      ORDER BY
        CASE
          WHEN status = 'listed' THEN 1
          WHEN status = 'sampled' THEN 2
          ELSE 3
        END,
        efficacy_score DESC NULLS LAST,
        random()
      LIMIT 20`;
  } else if (priceTier) {
    result = await sql<CatalogProduct[]>`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, review_signals, key_actives, suitable_for,
             image_url, description_generated, status
      FROM product_catalog
      WHERE suitable_for && ${concerns}
        AND status IN ('listed', 'sampled', 'research')
        AND NOT (contraindications && ${sensitivities})
        AND price_tier = ${priceTier}
      ORDER BY
        CASE
          WHEN status = 'listed' THEN 1
          WHEN status = 'sampled' THEN 2
          ELSE 3
        END,
        efficacy_score DESC NULLS LAST,
        random()
      LIMIT 20`;
  } else if (category) {
    result = await sql<CatalogProduct[]>`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, review_signals, key_actives, suitable_for,
             image_url, description_generated, status
      FROM product_catalog
      WHERE suitable_for && ${concerns}
        AND status IN ('listed', 'sampled', 'research')
        AND NOT (contraindications && ${sensitivities})
        AND product_type = ${category}
      ORDER BY
        CASE
          WHEN status = 'listed' THEN 1
          WHEN status = 'sampled' THEN 2
          ELSE 3
        END,
        efficacy_score DESC NULLS LAST,
        random()
      LIMIT 20`;
  } else {
    result = await sql<CatalogProduct[]>`
      SELECT product_hash, display_name, category, product_type, price_tier,
             efficacy_score, review_signals, key_actives, suitable_for,
             image_url, description_generated, status
      FROM product_catalog
      WHERE suitable_for && ${concerns}
        AND status IN ('listed', 'sampled', 'research')
        AND NOT (contraindications && ${sensitivities})
      ORDER BY
        CASE
          WHEN status = 'listed' THEN 1
          WHEN status = 'sampled' THEN 2
          ELSE 3
        END,
        efficacy_score DESC NULLS LAST,
        random()
      LIMIT 20`;
  }

  return result;
}

function blendRecommendations(matches: CatalogProduct[]) {
  const listed = matches.filter((m) => m.status === "listed").slice(0, 3);
  const sampled = matches.filter((m) => m.status === "sampled").slice(0, 2);
  const research = matches.filter((m) => m.status === "research").slice(0, 3);

  return {
    primary: listed.map((p) => ({
      ...formatProduct(p),
      availability: "in_stock" as const,
      fulfillment: "crazy_gels",
      delivery: "2-3 days",
    })),

    secondary: sampled.map((p) => ({
      ...formatProduct(p),
      availability: "coming_soon" as const,
      fulfillment: "crazy_gels",
      notify_me: true,
    })),

    research: research.map((p) => ({
      ...formatProduct(p),
      availability: "research" as const,
      message:
        "Our AI identified this as optimal for your biology. Vote to fast-track.",
      vote_to_stock: true,
    })),

    meta: {
      total_matches: matches.length,
      timestamp: new Date().toISOString(),
    },
  };
}

function formatProduct(p: CatalogProduct) {
  return {
    product_hash: p.product_hash,
    display_name: p.display_name,
    category: p.category,
    product_type: p.product_type,
    price_tier: p.price_tier,
    efficacy_score: p.efficacy_score,
    review_signals: p.review_signals,
    key_actives: p.key_actives,
    suitable_for: p.suitable_for,
    image_url: p.image_url,
    description: p.description_generated,
  };
}
