import { cache } from 'react'
import { getAllProducts, isShopifyConfigured } from './index'
import type { Product } from './types'

// ──────────────────────────────────────────────
// PRIMARY CLASSIFICATION: skin vs hair
// ──────────────────────────────────────────────
const SKIN_KEYWORDS = [
  'skin', 'face', 'facial', 'serum', 'moisturizer', 'cleanser', 'toner',
  'mask', 'collagen', 'retinol', 'vitamin c', 'hyaluronic', 'spf', 'sunscreen',
  'anti-aging', 'wrinkle', 'pore', 'acne', 'blemish', 'dark spot', 'brightening',
  'exfoliant', 'peel', 'cream', 'lotion', 'eye cream', 'night cream',
  'day cream', 'oil', 'essence', 'mist', 'glow', 'radiance', 'complexion',
  'derma', 'skincare', 'hydrating', 'nourishing', 'firming', 'vegan serum',
  'overnight', 'collagen mask', 'face mask', 'treatment oil',
  'lip', 'body butter', 'body lotion', 'hand cream', 'foot cream',
  'neck cream', 'decollete', 'sheet mask', 'sleeping mask', 'clay mask',
  'charcoal', 'rose water', 'micellar', 'makeup remover', 'cleansing oil',
]

const HAIR_KEYWORDS = [
  'hair', 'shampoo', 'conditioner', 'scalp', 'follicle', 'keratin',
  'argan', 'biotin', 'growth', 'volume', 'frizz', 'curl', 'straight',
  'heat protect', 'hair mask', 'deep condition', 'leave-in', 'styling',
  'haircare', 'hair care', 'hair oil', 'hair serum', 'extensions',
  'clip-in', 'tape-in', 'ponytail', 'wig', 'thinning', 'damage repair',
  'split end', 'color protect', 'blonde', 'brunette', 'balayage',
  'dry shampoo', 'hair spray', 'mousse', 'gel', 'pomade', 'edge control',
  'braid', 'twist', 'locs', 'afro', 'textured hair', 'silk press',
  'bonnet', 'satin', 'detangle', 'wide tooth', 'paddle brush',
]

// ──────────────────────────────────────────────
// SUB-CATEGORY CLASSIFICATION
// Products get assigned to one or more sub-categories so the AI can
// filter precisely (e.g. "show me just moisturizers" or "serums for aging")
// ──────────────────────────────────────────────
const SKIN_SUBCATEGORIES: Record<string, string[]> = {
  'Cleansers': ['cleanser', 'cleansing', 'wash', 'micellar', 'makeup remover', 'cleansing oil', 'foam', 'gel cleanser'],
  'Toners & Essences': ['toner', 'essence', 'tonic', 'astringent', 'mist', 'rose water', 'prep'],
  'Serums & Ampoules': ['serum', 'ampoule', 'concentrate', 'booster', 'vegan serum', 'treatment oil', 'elixir'],
  'Moisturizers': ['moisturizer', 'cream', 'lotion', 'day cream', 'night cream', 'gel cream', 'emulsion', 'butter', 'hydrating cream'],
  'Eye Care': ['eye cream', 'eye gel', 'eye mask', 'under eye', 'eye serum', 'dark circle', 'eye patch'],
  'Masks & Peels': ['mask', 'peel', 'collagen', 'sheet mask', 'clay mask', 'sleeping mask', 'overnight mask', 'face mask', 'charcoal mask', 'peel off'],
  'Sun Protection': ['spf', 'sunscreen', 'sunblock', 'uv protect', 'sun cream', 'sun lotion'],
  'Exfoliants': ['exfoliant', 'exfoliating', 'scrub', 'aha', 'bha', 'glycolic', 'salicylic', 'lactic', 'enzyme'],
  'Lip Care': ['lip', 'lip balm', 'lip mask', 'lip scrub', 'lip oil', 'lip treatment'],
  'Body Care': ['body butter', 'body lotion', 'body cream', 'body oil', 'hand cream', 'foot cream', 'body scrub', 'body wash'],
  'Acne & Blemish': ['acne', 'blemish', 'spot treatment', 'pimple', 'breakout', 'tea tree', 'salicylic', 'benzoyl'],
  'Anti-Aging': ['anti-aging', 'retinol', 'peptide', 'collagen', 'firming', 'wrinkle', 'fine line', 'lifting', 'mature skin'],
  'Brightening': ['brightening', 'vitamin c', 'niacinamide', 'dark spot', 'lighten', 'even tone', 'glow', 'radiance', 'luminous'],
}

const HAIR_SUBCATEGORIES: Record<string, string[]> = {
  'Shampoos': ['shampoo', 'cleansing shampoo', 'clarifying shampoo', 'dry shampoo', 'co-wash'],
  'Conditioners': ['conditioner', 'deep condition', 'rinse-out', 'co-wash'],
  'Hair Masks & Treatments': ['hair mask', 'deep treatment', 'protein treatment', 'bond repair', 'reconstructing', 'intensive', 'hair treatment'],
  'Oils & Serums': ['hair oil', 'hair serum', 'argan oil', 'castor oil', 'jojoba', 'marula', 'hair elixir'],
  'Leave-In Products': ['leave-in', 'detangler', 'leave in conditioner', 'spray conditioner', 'milk spray', 'cream rinse'],
  'Styling Products': ['styling', 'mousse', 'gel', 'pomade', 'wax', 'hair spray', 'edge control', 'setting', 'hold', 'curl cream', 'defining'],
  'Heat Protection': ['heat protect', 'thermal', 'heat shield', 'blow dry spray', 'flat iron spray'],
  'Hair Growth & Scalp': ['growth', 'scalp', 'thinning', 'biotin', 'follicle', 'minoxidil', 'caffeine', 'density', 'thickening', 'scalp scrub', 'scalp serum'],
  'Color Care': ['color protect', 'color safe', 'dyed', 'bleached', 'toner', 'purple shampoo', 'blonde care', 'color depositing'],
  'Extensions & Wigs': ['extension', 'clip-in', 'tape-in', 'ponytail', 'wig', 'topper', 'hairpiece', 'bundles', 'closure', 'frontal'],
  'Tools & Accessories': ['brush', 'comb', 'bonnet', 'satin', 'silk', 'towel', 'cap', 'clips', 'pins', 'rollers'],
  'Curl & Texture': ['curl', 'curly', 'coil', 'wave', 'twist', 'braid', 'locs', 'afro', 'textured', 'natural hair'],
}

// ──────────────────────────────────────────────
// CONCERN MATCHING: maps user concerns to product keywords
// ──────────────────────────────────────────────
const SKIN_CONCERN_KEYWORDS: Record<string, string[]> = {
  'acne': ['acne', 'blemish', 'breakout', 'pore', 'oil control', 'salicylic', 'tea tree', 'clay', 'purifying', 'clear', 'spot treatment', 'pimple'],
  'aging': ['anti-aging', 'wrinkle', 'fine line', 'firming', 'collagen', 'retinol', 'peptide', 'lifting', 'mature', 'anti aging', 'age defying'],
  'dryness': ['hydrating', 'moisturizing', 'nourishing', 'dry skin', 'hyaluronic', 'barrier', 'repair', 'cream', 'rich', 'intense moisture', 'ultra hydrating'],
  'sensitivity': ['sensitive', 'gentle', 'calming', 'soothing', 'redness', 'fragrance-free', 'hypoallergenic', 'aloe', 'chamomile', 'centella', 'cica'],
  'hyperpigmentation': ['brightening', 'dark spot', 'vitamin c', 'even tone', 'glow', 'radiance', 'lighten', 'niacinamide', 'alpha arbutin', 'tranexamic'],
  'oily': ['oil control', 'mattifying', 'lightweight', 'gel', 'oily skin', 'pore minimizing', 'balancing', 'sebum', 'shine control'],
  'dull': ['brightening', 'glow', 'radiance', 'exfoliant', 'peel', 'vitamin c', 'resurfacing', 'luminous', 'dull skin', 'revitalizing'],
  'dark circles': ['eye cream', 'under eye', 'dark circle', 'caffeine', 'depuff', 'eye area', 'eye gel', 'eye patch', 'eye mask'],
  'uneven texture': ['exfoliant', 'peel', 'aha', 'bha', 'glycolic', 'smooth', 'resurfacing', 'texture', 'refining', 'polishing'],
  'sun damage': ['spf', 'sunscreen', 'uv protect', 'sun damage', 'photoaging', 'sun repair'],
  'dehydration': ['hyaluronic', 'hydrating', 'moisture', 'plumping', 'water', 'aqua', 'dewdrop', 'dewy'],
  'large pores': ['pore', 'pore minimizing', 'refining', 'tightening', 'niacinamide', 'clay', 'astringent'],
}

const HAIR_CONCERN_KEYWORDS: Record<string, string[]> = {
  'damage': ['repair', 'damaged', 'restore', 'strengthen', 'bond', 'protein', 'reconstructing', 'broken', 'rescue', 'intensive repair'],
  'dryness': ['hydrating', 'moisturizing', 'dry', 'nourishing', 'deep condition', 'oil', 'butter', 'argan', 'moisture', 'quench'],
  'frizz': ['frizz', 'smooth', 'anti-frizz', 'sleek', 'humidity', 'keratin', 'straightening', 'frizz control', 'flyaway'],
  'thinning': ['thickening', 'volume', 'thin', 'fuller', 'biotin', 'growth', 'density', 'scalp', 'hair loss', 'thinning'],
  'color-treated': ['color protect', 'color safe', 'dyed', 'bleached', 'treated', 'fade prevention', 'color care', 'vibrancy'],
  'scalp issues': ['scalp', 'dandruff', 'itchy', 'flaky', 'tea tree', 'salicylic', 'exfoliating', 'clarifying', 'scalp health'],
  'curl definition': ['curl', 'curly', 'coil', 'wave', 'define', 'bounce', 'moisture', 'frizz control', 'curl cream', 'curl enhancing'],
  'lack of volume': ['volume', 'volumizing', 'lift', 'body', 'fullness', 'fine hair', 'lightweight', 'root lift', 'thickening'],
  'heat damage': ['heat protect', 'thermal', 'heat shield', 'blow dry', 'flat iron', 'styling', 'heat repair'],
  'breakage': ['breakage', 'brittle', 'snap', 'strengthen', 'bond', 'protein', 'fortifying', 'elasticity'],
  'oily scalp': ['clarifying', 'oil control', 'greasy', 'sebum', 'purifying', 'deep cleanse', 'balancing shampoo'],
  'split ends': ['split end', 'sealing', 'trimming', 'repair', 'mending', 'bond repair'],
}

export interface CatalogProduct {
  id: string
  handle: string
  title: string
  description: string
  price: string
  compareAtPrice?: string
  imageUrl?: string
  imageAlt?: string
  tags: string[]
  productType: string
  availableForSale: boolean
  concerns: string[]       // matched user concerns
  subcategories: string[]  // product sub-categories (e.g. "Serums & Ampoules", "Masks & Peels")
}

export interface ProductCatalog {
  skinProducts: CatalogProduct[]
  hairProducts: CatalogProduct[]
  allProducts: CatalogProduct[]
}

function formatPrice(amount: string, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount))
}

function getSearchText(product: Product): string {
  return `${product.title} ${product.description} ${product.tags.join(' ')} ${product.productType}`.toLowerCase()
}

function matchesConcerns(searchText: string, concernKeywords: Record<string, string[]>): string[] {
  const matched: string[] = []
  for (const [concern, keywords] of Object.entries(concernKeywords)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      matched.push(concern)
    }
  }
  return matched
}

function matchesSubcategories(searchText: string, subcatMap: Record<string, string[]>): string[] {
  const matched: string[] = []
  for (const [subcat, keywords] of Object.entries(subcatMap)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      matched.push(subcat)
    }
  }
  return matched
}

function classifyProduct(searchText: string): 'skin' | 'hair' | 'both' | 'none' {
  const isSkin = SKIN_KEYWORDS.some(kw => searchText.includes(kw))
  const isHair = HAIR_KEYWORDS.some(kw => searchText.includes(kw))
  
  if (isSkin && isHair) return 'both'
  if (isSkin) return 'skin'
  if (isHair) return 'hair'
  return 'none'
}

function productToCatalogItem(product: Product, type: 'skin' | 'hair'): CatalogProduct {
  const searchText = getSearchText(product)
  const concernKeywords = type === 'skin' ? SKIN_CONCERN_KEYWORDS : HAIR_CONCERN_KEYWORDS
  const subcatMap = type === 'skin' ? SKIN_SUBCATEGORIES : HAIR_SUBCATEGORIES
  
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    price: formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode),
    compareAtPrice: product.variants.edges[0]?.node.compareAtPrice
      ? formatPrice(product.variants.edges[0].node.compareAtPrice.amount, product.variants.edges[0].node.compareAtPrice.currencyCode)
      : undefined,
    imageUrl: product.featuredImage?.url,
    imageAlt: product.featuredImage?.altText || product.title,
    tags: product.tags,
    productType: product.productType,
    availableForSale: product.availableForSale,
    concerns: matchesConcerns(searchText, concernKeywords),
    subcategories: matchesSubcategories(searchText, subcatMap),
  }
}

// Build the full product catalog from ALL Shopify products, classified for skin and hair consultants
// Wrapped in React cache() to deduplicate within a single server render
export const buildProductCatalog = cache(async function buildProductCatalog(): Promise<ProductCatalog> {
  if (!isShopifyConfigured) {
    return { skinProducts: [], hairProducts: [], allProducts: [] }
  }
  
  const skinProducts: CatalogProduct[] = []
  const hairProducts: CatalogProduct[] = []
  const allProducts: CatalogProduct[] = []
  
  try {
    // Pull ALL 774 products from the store using cursor-based pagination
    const allShopifyProducts = await getAllProducts({})
    
    for (const product of allShopifyProducts) {
      if (!product.availableForSale) continue
      
      const searchText = getSearchText(product)
      const classification = classifyProduct(searchText)
      
      if (classification === 'skin' || classification === 'both') {
        const catalogItem = productToCatalogItem(product, 'skin')
        skinProducts.push(catalogItem)
        allProducts.push(catalogItem)
      }
      if (classification === 'hair' || classification === 'both') {
        const catalogItem = productToCatalogItem(product, 'hair')
        hairProducts.push(catalogItem)
        // Only add to allProducts once if it's both
        if (classification !== 'both') allProducts.push(catalogItem)
      }
      // Products that match neither skin nor hair are skipped (e.g. nail wraps)
    }
    
  } catch (error) {
    console.error('[product-catalog] Failed to build catalog:', error)
  }
  
  return { skinProducts, hairProducts, allProducts }
})

// Generate a text-based product catalog for the AI system prompt
export function catalogToPromptText(products: CatalogProduct[], type: 'skin' | 'hair'): string {
  if (products.length === 0) {
    return 'No products currently available in this category.'
  }
  
  const lines = products.map((p, i) => {
    const parts = [
      `${i + 1}. "${p.title}"`,
      `   Handle: ${p.handle}`,
      `   Price: ${p.price}${p.compareAtPrice ? ` (was ${p.compareAtPrice})` : ''}`,
      `   Description: ${p.description.slice(0, 200)}${p.description.length > 200 ? '...' : ''}`,
    ]
    
    if (p.subcategories.length > 0) {
      parts.push(`   Category: ${p.subcategories.join(', ')}`)
    }
    if (p.concerns.length > 0) {
      parts.push(`   Best for: ${p.concerns.join(', ')}`)
    }
    if (p.tags.length > 0) {
      parts.push(`   Tags: ${p.tags.slice(0, 5).join(', ')}`)
    }
    
    return parts.join('\n')
  })
  
  return lines.join('\n\n')
}

// Filter products by subcategory
export function filterProductsBySubcategory(products: CatalogProduct[], subcategories: string[]): CatalogProduct[] {
  if (subcategories.length === 0) return products
  const normalized = subcategories.map(s => s.toLowerCase())
  return products.filter(p =>
    p.subcategories.some(sc => normalized.includes(sc.toLowerCase()))
  )
}

// Filter products by concern keywords
export function filterProductsByConcern(products: CatalogProduct[], concerns: string[]): CatalogProduct[] {
  if (concerns.length === 0) return products
  
  const normalizedConcerns = concerns.map(c => c.toLowerCase())
  
  return products
    .filter(p => {
      // Check if product matches any of the given concerns
      return p.concerns.some(pc => normalizedConcerns.includes(pc))
    })
    .sort((a, b) => {
      // Sort by number of matching concerns (most relevant first)
      const aMatches = a.concerns.filter(c => normalizedConcerns.includes(c)).length
      const bMatches = b.concerns.filter(c => normalizedConcerns.includes(c)).length
      return bMatches - aMatches
    })
}
