import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { buildProductCatalog, catalogToPromptText } from '@/lib/shopify/product-catalog';
import sql from '@/lib/db';

// Fetch stocked products from product_catalog DB that are approved for sale
async function getStockedIntelligenceProducts(consultType: string) {
  try {
    const rows = await sql`
      SELECT
        pc.product_hash,
        pc.display_name,
        pc.category,
        pc.product_type,
        pc.price_tier,
        pc.efficacy_score,
        pc.key_actives,
        pc.suitable_for,
        pc.contraindications,
        sd.retail_price,
        sd.fulfillment_method
      FROM stocking_decisions sd
      JOIN product_catalog pc ON sd.product_hash = pc.product_hash
      WHERE sd.decision = 'stock'
      ORDER BY pc.efficacy_score DESC NULLS LAST
      LIMIT 100
    `;
    // Filter by consult type based on category
    const skinKeywords = ['skincare', 'skin', 'face', 'serum', 'moisturizer', 'cleanser', 'sunscreen', 'mask'];
    const hairKeywords = ['hair', 'shampoo', 'conditioner', 'scalp', 'styling'];
    const keywords = consultType === 'skin' ? skinKeywords : hairKeywords;

    return rows.filter((r: Record<string, unknown>) => {
      const cat = ((r.category as string) || '').toLowerCase();
      const type = ((r.product_type as string) || '').toLowerCase();
      return keywords.some(kw => cat.includes(kw) || type.includes(kw));
    });
  } catch {
    return [];
  }
}

function stockedToPromptText(products: Record<string, unknown>[]): string {
  if (products.length === 0) return '';
  const lines = products.map((p, i) => {
    const parts = [
      `${i + 1}. "${p.display_name}"`,
      `   Category: ${p.category} (${p.product_type || 'general'})`,
      `   Price Tier: ${p.price_tier}${p.retail_price ? ` | Retail: ${p.retail_price} EUR` : ''}`,
      `   Efficacy Score: ${p.efficacy_score != null ? `${Math.round(Number(p.efficacy_score) * 100)}%` : 'N/A'}`,
    ];
    if (p.key_actives && (p.key_actives as string[]).length > 0) {
      parts.push(`   Key Actives: ${(p.key_actives as string[]).join(', ')}`);
    }
    if (p.suitable_for && (p.suitable_for as string[]).length > 0) {
      parts.push(`   Best For: ${(p.suitable_for as string[]).join(', ')}`);
    }
    if (p.contraindications && (p.contraindications as string[]).length > 0) {
      parts.push(`   Avoid If: ${(p.contraindications as string[]).join(', ')}`);
    }
    return parts.join('\n');
  });
  return lines.join('\n\n');
}

export async function POST(req: Request) {
  const { messages, consultType } = await req.json();

  // Fetch real product catalog from Shopify + stocked intelligence products
  const [catalog, stockedProducts] = await Promise.all([
    buildProductCatalog(),
    getStockedIntelligenceProducts(consultType),
  ]);
  const relevantProducts = consultType === 'skin' ? catalog.skinProducts : catalog.hairProducts;
  const productCatalogText = catalogToPromptText(relevantProducts, consultType);
  const stockedText = stockedToPromptText(stockedProducts);
  
  console.log(`[v0] Consult ${consultType}: ${relevantProducts.length} Shopify + ${stockedProducts.length} stocked intelligence products`);
  
  const productListForTool = relevantProducts.map(p => ({
    handle: p.handle,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    imageUrl: p.imageUrl,
    description: p.description.slice(0, 150),
    concerns: p.concerns,
    subcategories: p.subcategories,
  }));

  // Define system prompt based on consultation type
  const systemPrompt = consultType === 'skin' 
    ? `You are a friendly and knowledgeable virtual beauty consultant specializing in skincare. 
Your name is "Glow" and you work for CrazyGels beauty store.

Your role is to:
1. Ask thoughtful questions about the user's skin type, concerns, and current routine (2-4 questions max)
2. Provide personalized skincare advice based on their answers
3. Recommend SPECIFIC products from the CrazyGels catalog below
4. Explain WHY each product suits their specific needs

IMPORTANT RULES:
- ONLY recommend products from the catalog below. Never make up product names.
- When recommending products, ALWAYS call the recommendProducts tool with the exact product handles
- Reference products by their exact title
- Include the price in your recommendation
- Explain how each product addresses their specific concern
- After gathering enough info (2-4 questions), provide your analysis and call recommendProducts

Start by warmly greeting the user and asking about their primary skin concern.

Key skin types to assess: dry, oily, combination, sensitive, normal
Key concerns: acne, aging, hyperpigmentation, dryness, sensitivity, uneven texture, dark circles

===== CRAZYGELS SKINCARE PRODUCT CATALOG =====
${productCatalogText}
===== END CATALOG =====${stockedText ? `

===== COMING SOON - INTELLIGENCE-BACKED PRODUCTS =====
These products have been vetted by our research team with proven efficacy scores.
They may not yet be in the store but can be mentioned as "coming soon" if highly relevant.
${stockedText}
===== END INTELLIGENCE PRODUCTS =====` : ''}`
    : `You are a friendly and knowledgeable virtual beauty consultant specializing in hair care.
Your name is "Glow" and you work for CrazyGels beauty store.

Your role is to:
1. Ask thoughtful questions about the user's hair type, concerns, and styling goals (2-4 questions max)
2. Provide personalized hair care advice based on their answers
3. Recommend SPECIFIC products from the CrazyGels catalog below
4. Explain WHY each product suits their specific needs

IMPORTANT RULES:
- ONLY recommend products from the catalog below. Never make up product names.
- When recommending products, ALWAYS call the recommendProducts tool with the exact product handles
- Reference products by their exact title
- Include the price in your recommendation
- Explain how each product addresses their specific concern
- After gathering enough info (2-4 questions), provide your analysis and call recommendProducts

Start by warmly greeting the user and asking about their primary hair concern.

Key hair types to assess: straight, wavy, curly, coily, fine, thick, thin
Key concerns: damage, dryness, frizz, thinning, color-treated, scalp issues, lack of volume

===== CRAZYGELS HAIRCARE PRODUCT CATALOG =====
${productCatalogText}
===== END CATALOG =====${stockedText ? `

===== COMING SOON - INTELLIGENCE-BACKED PRODUCTS =====
These products have been vetted by our research team with proven efficacy scores.
They may not yet be in the store but can be mentioned as "coming soon" if highly relevant.
${stockedText}
===== END INTELLIGENCE PRODUCTS =====` : ''}`;

  // Define tools for product recommendations
  const tools = {
    recommendProducts: tool({
      description: 'Recommend specific CrazyGels products from the catalog. Call this tool when you have gathered enough information about the user and are ready to make product recommendations. Include 2-5 products that match their needs.',
      inputSchema: z.object({
        assessedType: z.string().describe('The assessed skin type or hair type'),
        primaryConcerns: z.array(z.string()).describe('List of primary concerns identified'),
        recommendedHandles: z.array(z.string()).describe('Array of product handles from the catalog to recommend (2-5 products)'),
        reasonsMap: z.record(z.string(), z.string()).describe('Map of product handle to the specific reason why it is recommended for this user'),
        routineSummary: z.string().describe('A brief paragraph summarizing the recommended routine and how to use the products together'),
      }),
      execute: async ({ assessedType, primaryConcerns, recommendedHandles, reasonsMap, routineSummary }) => {
        // Match recommended handles to actual product data
        const recommendedProducts = recommendedHandles
          .map(handle => {
            const product = productListForTool.find(p => p.handle === handle);
            if (!product) return null;
            return {
              ...product,
              reason: reasonsMap[handle] || 'Recommended for your needs',
            };
          })
          .filter(Boolean);

        return {
          success: true,
          assessedType,
          concerns: primaryConcerns,
          products: recommendedProducts,
          routineSummary,
          totalRecommended: recommendedProducts.length,
        };
      },
    }),
  };

  const result = streamText({
    model: 'openai/gpt-4o-mini',
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools,
    maxSteps: 5,
  });

  return result.toUIMessageStreamResponse();
}
