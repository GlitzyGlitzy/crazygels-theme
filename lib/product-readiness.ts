export const PUBLIC_RECOMMENDATION_STATUSES = ["listed", "sampled"] as const;
export const LISTING_READY_STATUSES = ["reviewed", "sampled"] as const;

export interface RecommendationReadinessFields {
  status: string | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
}

export function hasRequiredRecommendationEnrichment(
  product: Pick<
    RecommendationReadinessFields,
    "key_actives" | "suitable_for" | "contraindications"
  >
) {
  return (
    Array.isArray(product.key_actives) &&
    product.key_actives.length > 0 &&
    Array.isArray(product.suitable_for) &&
    product.suitable_for.length > 0 &&
    Array.isArray(product.contraindications)
  );
}

export function isPublicRecommendationReady(
  product: RecommendationReadinessFields
) {
  return (
    PUBLIC_RECOMMENDATION_STATUSES.includes(
      product.status as (typeof PUBLIC_RECOMMENDATION_STATUSES)[number]
    ) && hasRequiredRecommendationEnrichment(product)
  );
}

export function isListingReady(product: RecommendationReadinessFields) {
  return (
    LISTING_READY_STATUSES.includes(
      product.status as (typeof LISTING_READY_STATUSES)[number]
    ) && hasRequiredRecommendationEnrichment(product)
  );
}
