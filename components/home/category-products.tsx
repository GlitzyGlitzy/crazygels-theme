import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, ArrowRight } from "lucide-react"
import { getCollections, getAllCollectionProducts, isShopifyConfigured } from "@/lib/shopify"
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
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111111] border border-white/10 mb-3">
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            sizes="280px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/40">
            <ShoppingBag className="w-10 h-10" />
          </div>
        )}
        {(hasDiscount || isNew || isBestseller) && (
          <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full ${
            hasDiscount ? "bg-[#feca57] text-black" :
            isNew ? "bg-[#06b6d4] text-white" :
            "bg-[#ff00b0] text-white"
          }`}>
            {hasDiscount ? "Sale" : isNew ? "New" : "Bestseller"}
          </div>
        )}
        {!product.availableForSale && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="px-4 py-2 bg-white/10 rounded-full text-sm font-bold text-white">
              Sold Out
            </span>
          </div>
        )}
        <button 
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-[#ff00b0] hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
          aria-label={`Add ${product.title} to wishlist`}
        >
          <Heart className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <h3 className="text-white font-bold text-sm mb-1 group-hover:text-[#ff00b0] transition-colors line-clamp-2">
        {product.title}
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-[#ff00b0] font-bold text-sm">
          {formatPrice(price.amount, price.currencyCode)}
        </span>
        {hasDiscount && (
          <span className="text-white/50 line-through text-xs">
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
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 
              className="text-2xl md:text-3xl font-black mb-1"
              style={{ color: colorAccent }}
            >
              {collection.title.toUpperCase()}
            </h2>
            {collection.description && (
              <p className="text-white/60 text-sm md:text-base line-clamp-1">
                {collection.description}
              </p>
            )}
          </div>
          <Link 
            href={`/collections/${collection.handle}`}
            className="hidden md:inline-flex items-center gap-2 font-bold hover:underline transition-colors"
            style={{ color: colorAccent }}
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
            className="inline-flex items-center gap-2 font-bold"
            style={{ color: colorAccent }}
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
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 w-32 bg-[#111111] rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-[#111111] rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-[220px] md:w-[280px]">
              <div className="aspect-square bg-[#111111] rounded-2xl animate-pulse mb-3" />
              <div className="h-4 w-3/4 bg-[#111111] rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-[#111111] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Main category colors mapping
const categoryColors: Record<string, string> = {
  nails: "#ff00b0",
  nail: "#ff00b0",
  hair: "#7c3aed",
  skin: "#06b6d4",
  skincare: "#06b6d4",
  bundles: "#feca57",
  sale: "#ff6b6b",
  default: "#ff00b0"
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
    collections = await getCollections()
    // Filter out system collections and limit to main categories
    collections = collections.filter(c => 
      !c.handle.includes('all') && 
      !c.handle.includes('frontpage') &&
      c.handle !== 'sale'
    ).slice(0, 6) // Limit to 6 main categories
  } catch (error) {
    console.error("[v0] Error fetching collections:", error)
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
        const products = await getAllCollectionProducts({ 
          handle: collection.handle,
          sortKey: "BEST_SELLING"
        })
        console.log(`[v0] Collection "${collection.handle}": fetched ${products.length} products`)
        return { 
          collection, 
          products: products.slice(0, 12), // Limit to 12 products per category for display
          totalCount: products.length,
          color: getCategoryColor(collection.handle)
        }
      } catch (error) {
        console.error(`[v0] Error fetching products for ${collection.handle}:`, error)
        return { collection, products: [], totalCount: 0, color: getCategoryColor(collection.handle) }
      }
    })
  )

  // Log total product counts
  const totalProducts = collectionsWithProducts.reduce((sum, c) => sum + c.totalCount, 0)
  console.log(`[v0] TOTAL PRODUCTS FETCHED: ${totalProducts} across ${collectionsWithProducts.length} collections`)
  collectionsWithProducts.forEach(c => {
    console.log(`[v0]   - ${c.collection.title}: ${c.totalCount} products`)
  })

  // Filter out collections with no products
  const validCollections = collectionsWithProducts.filter(c => c.products.length > 0)

  return (
    <div className="bg-[#0a0a0a]">
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
