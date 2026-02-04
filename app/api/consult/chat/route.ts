import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages, consultType } = await req.json();

  // Define system prompt based on consultation type
  const systemPrompt = consultType === 'skin' 
    ? `You are a friendly and knowledgeable virtual beauty consultant specializing in skincare. 
Your name is "Glow" and you work for Crazy Gels beauty store.

Your role is to:
1. Ask thoughtful questions about the user's skin type, concerns, and current routine
2. Provide personalized skincare advice based on their answers
3. Recommend products from our catalog that would benefit them
4. Explain WHY each recommendation suits their needs

Start by warmly greeting the user and asking about their primary skin concern.

Key skin types to assess: dry, oily, combination, sensitive, normal
Key concerns: acne, aging, hyperpigmentation, dryness, sensitivity, uneven texture, dark circles

Be conversational, empathetic, and supportive. Avoid being too clinical.
When you have enough information (usually after 3-5 questions), provide a summary and product recommendations.`
    : `You are a friendly and knowledgeable virtual beauty consultant specializing in hair care.
Your name is "Glow" and you work for Crazy Gels beauty store.

Your role is to:
1. Ask thoughtful questions about the user's hair type, concerns, and styling goals
2. Provide personalized hair care advice based on their answers
3. Recommend products from our catalog that would benefit them
4. Explain WHY each recommendation suits their needs

Start by warmly greeting the user and asking about their primary hair concern.

Key hair types to assess: straight, wavy, curly, coily, fine, thick, thin
Key concerns: damage, dryness, frizz, thinning, color-treated, scalp issues, lack of volume

Be conversational, empathetic, and supportive. Avoid being too clinical.
When you have enough information (usually after 3-5 questions), provide a summary and product recommendations.`;

  // Define tools for product recommendations
  const tools = {
    recommendProducts: tool({
      description: 'Recommend specific products based on the consultation. Call this when you have enough information about the user.',
      inputSchema: z.object({
        skinType: z.string().nullable().describe('The assessed skin type'),
        hairType: z.string().nullable().describe('The assessed hair type'),
        primaryConcerns: z.array(z.string()).describe('List of primary concerns identified'),
        recommendations: z.array(z.object({
          category: z.string().describe('Product category (cleanser, moisturizer, serum, etc.)'),
          reason: z.string().describe('Why this type of product is recommended'),
        })).describe('Product type recommendations with reasons'),
        routineSummary: z.string().describe('A brief summary of the recommended routine'),
      }),
      execute: async ({ skinType, hairType, primaryConcerns, recommendations, routineSummary }) => {
        return {
          success: true,
          skinType,
          hairType,
          concerns: primaryConcerns,
          recommendations,
          routineSummary,
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
