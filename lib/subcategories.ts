import type { Product } from '@/lib/shopify/types';

// Subcategory definitions per parent collection handle.
// Each subcategory has a label (displayed) and keywords used to match products.
export interface Subcategory {
  slug: string;
  label: string;
  keywords: string[];
}

// ── NAILS ────────────────────────────────────────
const NAIL_SUBCATEGORIES: Subcategory[] = [
  { slug: 'french-tips', label: 'French Tips', keywords: ['french', 'french tip', 'french style', 'french manicure'] },
  { slug: 'solid-colors', label: 'Solid Colors', keywords: ['solid', 'plain', 'single color', 'one color', 'classic'] },
  { slug: 'glitter-shimmer', label: 'Glitter & Shimmer', keywords: ['glitter', 'shimmer', 'sparkle', 'metallic', 'chrome', 'holographic', 'foil'] },
  { slug: 'floral', label: 'Floral', keywords: ['floral', 'flower', 'rose', 'daisy', 'botanical', 'blossom', 'petal', 'garden'] },
  { slug: 'marble-abstract', label: 'Marble & Abstract', keywords: ['marble', 'abstract', 'swirl', 'art', 'geometric', 'line art', 'minimal'] },
  { slug: 'seasonal', label: 'Seasonal', keywords: ['spring', 'summer', 'autumn', 'winter', 'christmas', 'halloween', 'valentine', 'holiday', 'festive'] },
  { slug: 'sets', label: 'Sets & Bundles', keywords: ['set', 'bundle', 'pack', 'kit', 'combo', 'collection set', 'multi'] },
  { slug: 'pedicure', label: 'Pedicure', keywords: ['pedicure', 'toe', 'toenail', 'foot', 'pedi'] },
];

// ── HAIR CARE ────────────────────────────────────
const HAIR_SUBCATEGORIES: Subcategory[] = [
  { slug: 'shampoo', label: 'Shampoo', keywords: ['shampoo', 'cleansing shampoo', 'clarifying shampoo', 'dry shampoo', 'co-wash'] },
  { slug: 'conditioner', label: 'Conditioner', keywords: ['conditioner', 'deep condition', 'rinse-out', 'co-wash'] },
  { slug: 'hair-masks', label: 'Hair Masks', keywords: ['hair mask', 'deep treatment', 'protein treatment', 'bond repair', 'reconstructing', 'intensive', 'hair treatment'] },
  { slug: 'oils-serums', label: 'Oils & Serums', keywords: ['hair oil', 'hair serum', 'argan oil', 'castor oil', 'jojoba', 'marula', 'hair elixir'] },
  { slug: 'leave-in', label: 'Leave-In Products', keywords: ['leave-in', 'detangler', 'leave in conditioner', 'spray conditioner', 'milk spray'] },
  { slug: 'styling', label: 'Styling', keywords: ['styling', 'mousse', 'pomade', 'wax', 'hair spray', 'edge control', 'setting', 'hold', 'curl cream', 'defining'] },
  { slug: 'hair-growth', label: 'Hair Growth & Scalp', keywords: ['growth', 'scalp', 'thinning', 'biotin', 'follicle', 'caffeine', 'density', 'thickening', 'scalp scrub', 'scalp serum'] },
  { slug: 'heat-protection', label: 'Heat Protection', keywords: ['heat protect', 'thermal', 'heat shield', 'blow dry spray', 'flat iron spray'] },
  { slug: 'color-care', label: 'Color Care', keywords: ['color protect', 'color safe', 'dyed', 'bleached', 'toner', 'purple shampoo', 'blonde care'] },
  { slug: 'extensions', label: 'Extensions & Wigs', keywords: ['extension', 'clip-in', 'tape-in', 'ponytail', 'wig', 'topper', 'hairpiece', 'bundles', 'closure', 'frontal'] },
  { slug: 'tools', label: 'Tools & Accessories', keywords: ['brush', 'comb', 'bonnet', 'satin', 'silk', 'towel', 'cap', 'clips', 'pins', 'rollers', 'dryer', 'straightener', 'curling'] },
];

// ── SKINCARE ─────────────────────────────────────
const SKIN_SUBCATEGORIES: Subcategory[] = [
  { slug: 'face-cream', label: 'Face Creams', keywords: ['moisturizer', 'cream', 'day cream', 'night cream', 'gel cream', 'face cream', 'emulsion', 'hydrating cream'] },
  { slug: 'wash-gels', label: 'Wash Gels & Cleansers', keywords: ['cleanser', 'cleansing', 'wash', 'micellar', 'makeup remover', 'cleansing oil', 'foam', 'gel cleanser', 'face wash'] },
  { slug: 'toners', label: 'Toners & Essences', keywords: ['toner', 'essence', 'tonic', 'astringent', 'mist', 'rose water', 'prep'] },
  { slug: 'serums', label: 'Serums', keywords: ['serum', 'ampoule', 'concentrate', 'booster', 'vegan serum', 'treatment oil', 'elixir'] },
  { slug: 'face-masks', label: 'Face Masks', keywords: ['mask', 'peel', 'collagen', 'sheet mask', 'clay mask', 'sleeping mask', 'overnight mask', 'face mask', 'charcoal mask', 'peel off'] },
  { slug: 'eye-care', label: 'Eye Care', keywords: ['eye cream', 'eye gel', 'eye mask', 'under eye', 'eye serum', 'dark circle', 'eye patch'] },
  { slug: 'sun-protection', label: 'Sun Protection', keywords: ['spf', 'sunscreen', 'sunblock', 'uv protect', 'sun cream', 'sun lotion'] },
  { slug: 'lip-care', label: 'Lip Care', keywords: ['lip', 'lip balm', 'lip mask', 'lip scrub', 'lip oil', 'lip treatment'] },
  { slug: 'body-care', label: 'Body Care', keywords: ['body butter', 'body lotion', 'body cream', 'body oil', 'hand cream', 'foot cream', 'body scrub', 'body wash'] },
  { slug: 'exfoliants', label: 'Exfoliants', keywords: ['exfoliant', 'exfoliating', 'scrub', 'aha', 'bha', 'glycolic', 'salicylic', 'lactic', 'enzyme'] },
];

// ── TREATMENTS / ACCESSORIES ─────────────────────
const TREATMENT_SUBCATEGORIES: Subcategory[] = [
  { slug: 'uv-lamps', label: 'UV & LED Lamps', keywords: ['uv lamp', 'led lamp', 'nail lamp', 'curing lamp', 'uv light', 'led light'] },
  { slug: 'nail-accessories', label: 'Nail Accessories', keywords: ['nail file', 'buffer', 'cuticle', 'nail prep', 'base coat', 'top coat', 'remover', 'acetone', 'nail tool', 'application kit', 'nail kit', 'pusher', 'clipper', 'tweezer'] },
  { slug: 'beauty-tools', label: 'Beauty Tools', keywords: ['beauty tool', 'roller', 'gua sha', 'massager', 'mirror', 'sponge', 'applicator'] },
  { slug: 'sets', label: 'Sets & Kits', keywords: ['set', 'kit', 'bundle', 'starter', 'combo', 'gift set'] },
];

// ── COLLAGEN MASKS ───────────────────────────────
const COLLAGEN_SUBCATEGORIES: Subcategory[] = [
  { slug: 'overnight', label: 'Overnight Masks', keywords: ['overnight', 'sleeping mask', 'night mask', 'sleep'] },
  { slug: 'sheet-masks', label: 'Sheet Masks', keywords: ['sheet mask', 'sheet', 'bio-cellulose'] },
  { slug: 'peel-off', label: 'Peel-Off Masks', keywords: ['peel off', 'peel-off', 'peeloff'] },
  { slug: 'hydrating', label: 'Hydrating', keywords: ['hydrating', 'moisture', 'hyaluronic', 'aqua', 'water'] },
  { slug: 'anti-aging', label: 'Anti-Aging', keywords: ['anti-aging', 'firming', 'lifting', 'wrinkle', 'peptide', 'collagen boost'] },
];

// Map collection handles to their subcategory definitions
const COLLECTION_SUBCATEGORIES: Record<string, Subcategory[]> = {
  // Nails
  'gel-nail-wraps': NAIL_SUBCATEGORIES,
  'french-styles': NAIL_SUBCATEGORIES,
  nails: NAIL_SUBCATEGORIES,
  // Hair
  haircare: HAIR_SUBCATEGORIES,
  'hair-care': HAIR_SUBCATEGORIES,
  hair: HAIR_SUBCATEGORIES,
  // Skin
  skincare: SKIN_SUBCATEGORIES,
  'skin-care': SKIN_SUBCATEGORIES,
  skin: SKIN_SUBCATEGORIES,
  // Treatments
  treatments: TREATMENT_SUBCATEGORIES,
  // Collagen masks
  'collagen-masks': COLLAGEN_SUBCATEGORIES,
  // Sets -- use nail subcategories since sets are mostly nail-related
  sets: NAIL_SUBCATEGORIES,
};

/**
 * Get subcategory definitions for a collection handle.
 * Returns an empty array if the collection has no subcategories.
 */
export function getSubcategoriesForCollection(handle: string): Subcategory[] {
  return COLLECTION_SUBCATEGORIES[handle.toLowerCase()] || [];
}

/**
 * Check if a product matches a subcategory by scanning its title,
 * description, tags, and productType for the subcategory keywords.
 */
export function productMatchesSubcategory(product: Product, subcategory: Subcategory): boolean {
  const text = `${product.title} ${product.description} ${product.tags?.join(' ') || ''} ${product.productType || ''}`.toLowerCase();
  return subcategory.keywords.some((kw) => text.includes(kw.toLowerCase()));
}

/**
 * Filter products by a subcategory slug.
 */
export function filterBySubcategory(products: Product[], handle: string, subcategorySlug: string): Product[] {
  const subcategories = getSubcategoriesForCollection(handle);
  const subcategory = subcategories.find((sc) => sc.slug === subcategorySlug);
  if (!subcategory) return products;
  return products.filter((p) => productMatchesSubcategory(p, subcategory));
}

/**
 * Count how many products exist per subcategory.
 * Only returns subcategories that have at least 1 matching product.
 */
export function getSubcategoryCounts(products: Product[], handle: string): { subcategory: Subcategory; count: number }[] {
  const subcategories = getSubcategoriesForCollection(handle);
  return subcategories
    .map((sc) => ({
      subcategory: sc,
      count: products.filter((p) => productMatchesSubcategory(p, sc)).length,
    }))
    .filter((entry) => entry.count > 0);
}
