import { Suspense } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getCollectionProducts, getAllProducts, isShopifyConfigured } from "@/lib/shopify"
import type { Product } from "@/lib/shopify/types"
import { formatPrice } from "@/lib/utils"

function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = product.priceRange?.minVariantPrice
  const imageUrl = product.featuredImage?.url || null

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[var(--bio-card)] border border-[var(--bio-border)] mb-3">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading={priority ? "eager" : "lazy"}
            {...(priority ? { fetchPriority: "high" as const } : {})}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[var(--bio-text-muted)] text-sm">
            No image
          </div>
        )}
      </div>
      <h3 className="text-xs md:text-sm font-normal text-[var(--bio-text)] group-hover:text-[var(--bio-teal)] transition-colors tracking-wide line-clamp-1">
        {product.title}
      </h3>
      {price && (
        <p className="text-xs md:text-sm text-[var(--bio-text-muted)] mt-1">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      )}
    </Link>
  )
}

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-[var(--bio-card)] mb-3" />
          <div className="h-4 bg-[var(--bio-card)] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[var(--bio-card)] rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

const VIRTUAL_KEYWORDS: Record<string, string[]> = {
  "collagen-masks": [
    "collagen", "mask", "face mask", "overnight mask", "sleeping mask", "sheet mask",
    "moisturizing cream", "moisturizer", "face cream", "night cream", "day cream",
  ],
  fragrances: [
    "fragrance", "perfume", "parfum", "eau de", "body mist", "scent", "cologne", "duft",
  ],
}

async function CollectionProducts({
  handle,
  priority = false,
}: {
  handle: string
  priority?: boolean
}) {
  if (!isShopifyConfigured) return null
  try {
    let fetched
    if (VIRTUAL_KEYWORDS[handle]) {
      const all = await getAllProducts({})
      fetched = all.filter((p) => {
        const text =
          `${p.title} ${p.description} ${p.tags?.join(" ") || ""} ${p.productType || ""}`.toLowerCase()
        return VIRTUAL_KEYWORDS[handle].some((kw) => text.includes(kw.toLowerCase()))
      })
    } else {
      fetched = await getCollectionProducts({ handle, first: 8 })
    }
    const products = fetched.filter((p) => p.featuredImage?.url).slice(0, 4)
    if (products.length === 0) return null
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} priority={priority} />
        ))}
      </div>
    )
  } catch {
    return null
  }
}

const HOMEPAGE_COLLECTIONS = [
  { handle: "skincare", title: "Skin Optimization", subtitle: "Barrier repair & cellular renewal" },
  { handle: "haircare", title: "Scalp & Hair System", subtitle: "Follicle health & growth support" },
  { handle: "gel-nail-wraps", title: "Nail Intelligence", subtitle: "Keratin quality & structural support" },
  { handle: "collagen-masks", title: "Collagen Protocols", subtitle: "Deep hydration & protein synthesis" },
  { handle: "treatments", title: "Bio-Tools & Treatments", subtitle: "Advanced delivery systems" },
]

export function BioProductsSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            Shop The System
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            Curated Biological Interventions
          </h2>
        </div>

        <div className="space-y-16 md:space-y-24">
          {HOMEPAGE_COLLECTIONS.map((col, index) => (
            <div key={col.handle}>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-10">
                <div>
                  <p className="text-[10px] font-mono tracking-[0.2em] text-[var(--bio-teal)] uppercase mb-1.5">
                    {col.subtitle}
                  </p>
                  <h3 className="font-serif text-xl md:text-3xl font-light text-[var(--bio-text)]">
                    {col.title}
                  </h3>
                </div>
                <Link
                  href={`/collections/${col.handle}`}
                  className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-[var(--bio-teal)] uppercase hover:text-[var(--bio-text)] transition-colors"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <Suspense fallback={<ProductGridSkeleton />}>
                <CollectionProducts handle={col.handle} priority={index === 0} />
              </Suspense>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
