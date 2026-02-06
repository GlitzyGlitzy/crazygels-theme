import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, ArrowRight } from "lucide-react"
import { getCollections, getCollectionProducts, isShopifyConfigured } from "@/lib/shopify"

import { Product, Collection } from "@/lib/shopify/types"

function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount))
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const price = product.priceRange?.minVariantPrice
  const compareAtPrice = product.variants?.[0]?.compareAtPrice
  const hasDiscount = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)
  const tags = product.tags || []
  const isNew = tags.includes("new") || tags.includes("New")
  const isBestseller = tags.includes("bestseller") || tags.includes("Bestseller")
  
  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex-shrink-0 w-[220px] md:w-[280px]"
    >
      <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#D4AF37]/10 mb-3 shadow-sm">
        {product.featuredImage?.url ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            sizes="280px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#C9A9A6]">
            <ShoppingBag className="w-10 h-10" />
          </div>
        )}
        {(hasDiscount || isNew || isBestseller) && (
          <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-medium tracking-wide rounded-full ${
            hasDiscount ? "bg-[#B8860B] text-white" :
            isNew ? "bg-[#8B7355] text-white" :
            "bg-[#D4AF37] text-white"
          }`}>
            {hasDiscount ? "Sale" : isNew ? "New" : "Bestseller"}
          </div>
        )}
        {!product.availableForSale && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#FAF7F2]/80">
            <span className="px-4 py-2 bg-[#2C2C2C]/10 rounded-full text-sm font-medium text-[#2C2C2C]">
              Sold Out
            </span>
          </div>
        )}
        <button 
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#C9A9A6] hover:text-[#D4AF37] hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
          aria-label={`Add ${product.title} to wishlist`}
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <h3 className="text-[#2C2C2C] font-medium text-sm mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
        {product.title}
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-[#B8860B] font-semibold text-sm">
          {formatPrice(price.amount, price.currencyCode)}
        </span>
        {hasDiscount && (
          <span className="text-[#9B9B9B] line-through text-xs">
            {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
          </span>
        )}
      </div>
    </Link>
  )
}

// Category Section Component
function CategorySection({ 
  collection, 
  products, 
  colorAccent 
}: { 
  collection: Collection
  products: Product[]
  colorAccent: string 
}) {
  if (products.length === 0) return null

  return (
    <section className="py-12 md:py-16 border-b border-[#D4AF37]/10 last:border-b-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 
              className="text-xl md:text-2xl font-light tracking-[0.15em] text-[#2C2C2C] mb-1"
            >
              {collection.title.toUpperCase()}
            </h2>
            {collection.description && (
              <p className="text-[#9B9B9B] text-sm md:text-base line-clamp-1">
                {collection.description}
              </p>
            )}
          </div>
          <Link 
            href={`/collections/${collection.handle}`}
            className="hidden md:inline-flex items-center gap-2 font-medium text-[#D4AF37] hover:text-[#B8860B] transition-colors text-sm tracking-wide"
          >
            View All <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Horizontal Scroll Products */}
        <div className="relative -mx-4 md:mx-0">
          <div className="flex gap-4 overflow-x-auto px-4 md:px-0 pb-4 scrollbar-hide snap-x snap-mandatory">
            {products.map((product) => (
              <div key={product.id} className="snap-start">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View All Link */}
        <div className="mt-4 text-center md:hidden">
          <Link 
            href={`/collections/${collection.handle}`}
            className="inline-flex items-center gap-2 font-medium text-[#D4AF37] text-sm tracking-wide"
          >
            View All {collection.title} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  )
}

// Loading skeleton for category section
export function CategorySectionSkeleton() {
  return (
    <section className="py-12 md:py-16 border-b border-[#D4AF37]/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-32 bg-[#E8C4C4]/30 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-[#E8C4C4]/20 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-[220px] md:w-[280px]">
              <div className="aspect-square bg-[#E8C4C4]/20 rounded-xl animate-pulse mb-3" />
              <div className="h-4 w-3/4 bg-[#E8C4C4]/20 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-[#E8C4C4]/20 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Luxury category colors - soft, elegant tones
const categoryColors: Record<string, string> = {
  nails: "#D4AF37",      // Champagne gold
  nail: "#D4AF37",
  hair: "#8B7355",       // Warm taupe
  skin: "#C9A9A6",       // Dusty rose
  skincare: "#C9A9A6",
  bundles: "#B8860B",    // Deep gold
  sale: "#C9A9A6",       // Muted rose
  default: "#D4AF37"
}

function getCategoryColor(handle: string): string {
  const lowerHandle = handle.toLowerCase()
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerHandle.includes(key)) return color
  }
  return categoryColors.default
}

// Main component that fetches and displays all categories
export async function CategoryProducts() {
  if (!isShopifyConfigured) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-white/60">Connect your Shopify store to display products by category.</p>
      </div>
    )
  }

  let collections: Collection[] = []
  
  try {
    const allCollections = await getCollections()
    
    // Filter out system collections - no limit on categories
    collections = allCollections.filter(c => 
      !c.handle.includes('all') && 
      !c.handle.includes('frontpage') &&
      c.handle !== 'sale'
    )
  } catch (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-white/60">Unable to load categories. Please try again later.</p>
      </div>
    )
  }

  if (collections.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-white/60">No categories found in your store.</p>
      </div>
    )
  }

  // Fetch products for each collection in parallel
  const collectionsWithProducts = await Promise.all(
    collections.map(async (collection) => {
      try {
        const products = await getCollectionProducts({ 
          handle: collection.handle,
          sortKey: "BEST_SELLING",
          first: 20
        })
        return { 
          collection, 
          products: products,
          totalCount: products.length,
          color: getCategoryColor(collection.handle)
        }
      } catch (error) {
        return { collection, products: [], totalCount: 0, color: getCategoryColor(collection.handle) }
      }
    })
  )

  // Filter out collections with no products
  const validCollections = collectionsWithProducts.filter(c => c.products.length > 0)

  return (
    <div className="bg-[#FFFEF9]">
      {validCollections.map(({ collection, products, color }) => (
        <CategorySection
          key={collection.id}
          collection={collection}
          products={products}
          colorAccent={color}
        />
      ))}
    </div>
  )
}
