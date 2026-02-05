import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';
import { buildProductCatalog, catalogToPromptText } from '@/lib/shopify/product-catalog';

export async function POST(req: Request) {
  const { messages, consultType } = await req.json();

  // Fetch real product catalog from Shopify
  const catalog = await buildProductCatalog();
  const relevantProducts = consultType === 'skin' ? catalog.skinProducts : catalog.hairProducts;
  const productCatalogText = catalogToPromptText(relevantProducts, consultType);
  
  const productListForTool = relevantProducts.map(p => ({
    handle: p.handle,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    imageUrl: p.imageUrl,
    description: p.description.slice(0, 150),
    concerns: p.concerns,
    collection: p.collection,
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
===== END CATALOG =====`
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
===== END CATALOG =====`;

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
