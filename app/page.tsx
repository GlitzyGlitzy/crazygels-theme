import { Suspense } from "react"
import Link from "next/link"
import { Star, ArrowRight, Truck, Shield, RefreshCw } from "lucide-react"
import { getCollectionProducts, isShopifyConfigured, getProducts } from "@/lib/shopify"
import type { Product } from "@/lib/shopify/types"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"

export const revalidate = 300

function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount))
}

function ProductCard({ product }: { product: Product }) {
  const price = product.priceRange?.minVariantPrice
  const imageUrl = product.featuredImage?.url || null

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F3EF] mb-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#9B9B9B] text-sm">
            No image
          </div>
        )}
      </div>
      <h3 className="text-sm font-normal text-[#1A1A1A] group-hover:text-[#8B7355] transition-colors tracking-wide line-clamp-1">
        {product.title}
      </h3>
      {price && (
        <p className="text-sm text-[#1A1A1A] mt-1">
          {formatPrice(price.amount, price.currencyCode)}
        </p>
      )}
    </Link>
  )
}

function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-[4/5] bg-[#E8E4DC] mb-3" />
          <div className="h-4 bg-[#E8E4DC] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#E8E4DC] rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

async function CollectionProducts({ handle }: { handle: string }) {
  if (!isShopifyConfigured) return null
  try {
    const fetched = await getCollectionProducts({ handle, first: 4 })
    const products = fetched.filter((p) => p.featuredImage?.url).slice(0, 4)
    if (products.length === 0) return null
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    )
  } catch {
    return null
  }
}

async function HeroProductImage() {
  if (!isShopifyConfigured) return null
  try {
    const products = await getProducts({ first: 1 })
    const product = products.find((p) => p.featuredImage?.url)
    if (!product?.featuredImage?.url) return null
    return (
      <img
        src={product.featuredImage.url}
        alt={product.featuredImage.altText || product.title}
        className="absolute inset-0 w-full h-full object-cover"
      />
    )
  } catch {
    return null
  }
}

const HOMEPAGE_COLLECTIONS = [
  { handle: "gel-nail-wraps", title: "Gel Nail Wraps", bg: "bg-white" },
  { handle: "french-styles", title: "French Styles", bg: "bg-[#FAFAF8]" },
  { handle: "haircare", title: "Haircare", bg: "bg-white" },
  { handle: "skincare", title: "Skincare", bg: "bg-[#FAFAF8]" },
  { handle: "treatments", title: "Treatments", bg: "bg-white" },
]

export default function HomePage() {
  console.log("[v0] PAGE_V20_LOADED -- if you see fetchAllProducts in logs, the server is running a DIFFERENT file")
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-[#1A1A1A] py-3">
        <p className="text-center text-[11px] font-medium tracking-[0.2em] text-white uppercase">
          Complimentary Shipping on Orders Over $50
        </p>
      </div>

      <DynamicHeader />

      <main>
        <section className="relative">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-4">
                  New Collection
                </p>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light leading-[0.95] tracking-tight text-[#1A1A1A] mb-6 text-balance">
                  Effortless
                  <br />
                  <span className="italic">elegance</span>
                  <br />
                  at home
                </h1>
                <p className="text-base text-[#666] leading-relaxed max-w-md mb-8">
                  Premium semi-cured gel nails, luxury hair care, and refined skincare crafted for the modern woman.
                </p>
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1A1A1A] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#8B7355] transition-colors duration-300"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/5] bg-[#F5F3EF] overflow-hidden">
                  <Suspense fallback={<div className="absolute inset-0 bg-[#E8E4DC] animate-pulse" />}>
                    <HeroProductImage />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E8E4DC] bg-white">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E4DC]">
              <div className="flex items-center justify-center gap-4 py-5">
                <Truck className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Free Shipping $50+</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-5">
                <RefreshCw className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">14-Day Returns</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-5">
                <Shield className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Salon Quality</span>
              </div>
            </div>
          </div>
        </section>

        {HOMEPAGE_COLLECTIONS.map((col) => (
          <section key={col.handle} className={`py-16 lg:py-20 ${col.bg}`}>
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-2">
                    Collection
                  </p>
                  <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-[#1A1A1A]">
                    {col.title}
                  </h2>
                </div>
                <Link
                  href={`/collections/${col.handle}`}
                  className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#1A1A1A] uppercase hover:text-[#8B7355] transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <Suspense fallback={<ProductGridSkeleton />}>
                <CollectionProducts handle={col.handle} />
              </Suspense>
            </div>
          </section>
        ))}

        <section className="py-16 lg:py-20 bg-[#F5F3EF]">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-2">
                Reviews
              </p>
              <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-light tracking-tight text-[#1A1A1A]">
                What our clients say
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { quote: "The quality is absolutely incredible. These gel nails last over two weeks and look salon-fresh.", author: "Sarah M.", location: "Los Angeles" },
                { quote: "Crazy Gels is hands down the best. The application is foolproof and the results are amazing.", author: "Jessica T.", location: "Miami" },
                { quote: "Finally found skincare that actually works. The glow serum has transformed my routine.", author: "Emily R.", location: "New York" },
              ].map((t, i) => (
                <div key={i} className="bg-white p-8">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#8B7355] text-[#8B7355]" />
                    ))}
                  </div>
                  <p className="text-[#1A1A1A] leading-relaxed mb-4 font-light italic">
                    {`"${t.quote}"`}
                  </p>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{t.author}</p>
                    <p className="text-xs text-[#9B9B9B] tracking-wide">{t.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-[#1A1A1A]">
          <div className="max-w-xl mx-auto px-6 text-center">
            <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-2">
              Newsletter
            </p>
            <h2 className="font-serif text-2xl md:text-3xl font-light text-white mb-4">
              Join the inner circle
            </h2>
            <p className="text-white/60 mb-6 text-sm">
              Subscribe for exclusive offers, early access, and beauty tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm tracking-wide focus:outline-none focus:border-[#8B7355]"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-white text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#F5F3EF] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
