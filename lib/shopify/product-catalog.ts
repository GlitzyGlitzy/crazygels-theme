import { getProducts, getAllCollectionProducts, getCollections, isShopifyConfigured } from './index'
import type { Product, Collection } from './types'

// Keywords for classifying products into skin vs hair
const SKIN_KEYWORDS = [
  'skin', 'face', 'facial', 'serum', 'moisturizer', 'cleanser', 'toner',
  'mask', 'collagen', 'retinol', 'vitamin c', 'hyaluronic', 'spf', 'sunscreen',
  'anti-aging', 'wrinkle', 'pore', 'acne', 'blemish', 'dark spot', 'brightening',
  'exfoliant', 'peel', 'cream', 'lotion', 'eye cream', 'night cream',
  'day cream', 'oil', 'essence', 'mist', 'glow', 'radiance', 'complexion',
  'derma', 'skincare', 'hydrating', 'nourishing', 'firming', 'vegan serum',
  'overnight', 'collagen mask', 'face mask', 'treatment oil'
]

const HAIR_KEYWORDS = [
  'hair', 'shampoo', 'conditioner', 'scalp', 'follicle', 'keratin',
  'argan', 'biotin', 'growth', 'volume', 'frizz', 'curl', 'straight',
  'heat protect', 'hair mask', 'deep condition', 'leave-in', 'styling',
  'haircare', 'hair care', 'hair oil', 'hair serum', 'extensions',
  'clip-in', 'tape-in', 'ponytail', 'wig', 'thinning', 'damage repair',
  'split end', 'color protect', 'blonde', 'brunette', 'balayage'
]

const SKIN_COLLECTION_HANDLES = [
  'skincare', 'face-masks', 'vegan-serums', 'collagen-mask-overnight',
  'oils-treatments', 'treatments', 'skin'
]

const HAIR_COLLECTION_HANDLES = [
  'haircare', 'hair', 'hair-care'
]

// Concern-to-keyword mapping for skin
const SKIN_CONCERN_KEYWORDS: Record<string, string[]> = {
  'acne': ['acne', 'blemish', 'breakout', 'pore', 'oil control', 'salicylic', 'tea tree', 'clay', 'purifying', 'clear'],
  'aging': ['anti-aging', 'wrinkle', 'fine line', 'firming', 'collagen', 'retinol', 'peptide', 'lifting', 'mature'],
  'dryness': ['hydrating', 'moisturizing', 'nourishing', 'dry skin', 'hyaluronic', 'barrier', 'repair', 'cream', 'rich'],
  'sensitivity': ['sensitive', 'gentle', 'calming', 'soothing', 'redness', 'fragrance-free', 'hypoallergenic', 'aloe'],
  'hyperpigmentation': ['brightening', 'dark spot', 'vitamin c', 'even tone', 'glow', 'radiance', 'lighten', 'niacinamide'],
  'oily': ['oil control', 'mattifying', 'lightweight', 'gel', 'oily skin', 'pore minimizing', 'balancing'],
  'dull': ['brightening', 'glow', 'radiance', 'exfoliant', 'peel', 'vitamin c', 'resurfacing', 'luminous'],
  'dark circles': ['eye cream', 'under eye', 'dark circle', 'caffeine', 'depuff', 'eye area'],
  'uneven texture': ['exfoliant', 'peel', 'aha', 'bha', 'glycolic', 'smooth', 'resurfacing', 'texture'],
}

// Concern-to-keyword mapping for hair
const HAIR_CONCERN_KEYWORDS: Record<string, string[]> = {
  'damage': ['repair', 'damaged', 'restore', 'strengthen', 'bond', 'protein', 'reconstructing', 'broken'],
  'dryness': ['hydrating', 'moisturizing', 'dry', 'nourishing', 'deep condition', 'oil', 'butter', 'argan'],
  'frizz': ['frizz', 'smooth', 'anti-frizz', 'sleek', 'humidity', 'keratin', 'straightening'],
  'thinning': ['thickening', 'volume', 'thin', 'fuller', 'biotin', 'growth', 'density', 'scalp'],
  'color-treated': ['color protect', 'color safe', 'dyed', 'bleached', 'treated', 'fade prevention'],
  'scalp': ['scalp', 'dandruff', 'itchy', 'flaky', 'tea tree', 'salicylic', 'exfoliating', 'clarifying'],
  'curl': ['curl', 'curly', 'coil', 'wave', 'define', 'bounce', 'moisture', 'frizz control'],
  'volume': ['volume', 'volumizing', 'lift', 'body', 'fullness', 'fine hair', 'lightweight'],
  'heat damage': ['heat protect', 'thermal', 'heat shield', 'blow dry', 'flat iron', 'styling'],
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
  concerns: string[] // matched concerns
  collection?: string // which collection it belongs to
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

function matchesConcerns(product: Product, concernKeywords: Record<string, string[]>): string[] {
  const searchText = `${product.title} ${product.description} ${product.tags.join(' ')} ${product.productType}`.toLowerCase()
  const matchedConcerns: string[] = []
  
  for (const [concern, keywords] of Object.entries(concernKeywords)) {
    if (keywords.some(kw => searchText.includes(kw))) {
      matchedConcerns.push(concern)
    }
  }
  
  return matchedConcerns
}

function classifyProduct(product: Product, collectionHandle?: string): 'skin' | 'hair' | 'both' | 'none' {
  const searchText = `${product.title} ${product.description} ${product.tags.join(' ')} ${product.productType}`.toLowerCase()
  
  // Check collection first (most reliable)
  if (collectionHandle) {
    if (SKIN_COLLECTION_HANDLES.some(h => collectionHandle.includes(h))) return 'skin'
    if (HAIR_COLLECTION_HANDLES.some(h => collectionHandle.includes(h))) return 'hair'
  }
  
  const isSkin = SKIN_KEYWORDS.some(kw => searchText.includes(kw))
  const isHair = HAIR_KEYWORDS.some(kw => searchText.includes(kw))
  
  if (isSkin && isHair) return 'both'
  if (isSkin) return 'skin'
  if (isHair) return 'hair'
  return 'none'
}

function productToCatalogItem(product: Product, type: 'skin' | 'hair', collectionTitle?: string): CatalogProduct {
  const concernKeywords = type === 'skin' ? SKIN_CONCERN_KEYWORDS : HAIR_CONCERN_KEYWORDS
  
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
    concerns: matchesConcerns(product, concernKeywords),
    collection: collectionTitle
  }
}

// Build the full product catalog from Shopify, classified for skin and hair consultants
export async function buildProductCatalog(): Promise<ProductCatalog> {
  if (!isShopifyConfigured) {
    return { skinProducts: [], hairProducts: [], allProducts: [] }
  }
  
  const skinProducts: CatalogProduct[] = []
  const hairProducts: CatalogProduct[] = []
  const allProducts: CatalogProduct[] = []
  const seenIds = new Set<string>()
  
  try {
    // Fetch all collections to understand product groupings
    const collections = await getCollections()
    
    // Fetch products from skin-related collections
    for (const handle of SKIN_COLLECTION_HANDLES) {
      const collection = collections.find(c => c.handle === handle)
      if (!collection) continue
      
      try {
        const products = await getAllCollectionProducts({ handle })
        for (const product of products) {
          if (seenIds.has(product.id) || !product.availableForSale) continue
          seenIds.add(product.id)
          
          const catalogItem = productToCatalogItem(product, 'skin', collection.title)
          skinProducts.push(catalogItem)
          allProducts.push(catalogItem)
        }
      } catch (e) {
        // Skip failed collections
      }
    }
    
    // Fetch products from hair-related collections
    for (const handle of HAIR_COLLECTION_HANDLES) {
      const collection = collections.find(c => c.handle === handle)
      if (!collection) continue
      
      try {
        const products = await getAllCollectionProducts({ handle })
        for (const product of products) {
          if (seenIds.has(product.id) || !product.availableForSale) continue
          seenIds.add(product.id)
          
          const catalogItem = productToCatalogItem(product, 'hair', collection.title)
          hairProducts.push(catalogItem)
          allProducts.push(catalogItem)
        }
      } catch (e) {
        // Skip failed collections
      }
    }
    
    // Also fetch all products and classify any we missed
    const allShopifyProducts = await getProducts({ first: 100 })
    for (const product of allShopifyProducts) {
      if (seenIds.has(product.id) || !product.availableForSale) continue
      seenIds.add(product.id)
      
      const classification = classifyProduct(product)
      
      if (classification === 'skin' || classification === 'both') {
        const catalogItem = productToCatalogItem(product, 'skin')
        skinProducts.push(catalogItem)
        allProducts.push(catalogItem)
      }
      if (classification === 'hair' || classification === 'both') {
        const catalogItem = productToCatalogItem(product, 'hair')
        hairProducts.push(catalogItem)
        if (classification !== 'both') allProducts.push(catalogItem)
      }
    }
    
  } catch (error) {
    // Silently fail - return empty catalog
  }
  
  return { skinProducts, hairProducts, allProducts }
}

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
    
    if (p.concerns.length > 0) {
      parts.push(`   Best for: ${p.concerns.join(', ')}`)
    }
    if (p.tags.length > 0) {
      parts.push(`   Tags: ${p.tags.slice(0, 5).join(', ')}`)
    }
    if (p.collection) {
      parts.push(`   Collection: ${p.collection}`)
    }
    
    return parts.join('\n')
  })
  
  return lines.join('\n\n')
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
