import { Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star, ArrowRight, Truck, Shield, RefreshCw } from "lucide-react"
import { getCollectionProducts, getAllProducts, isShopifyConfigured } from "@/lib/shopify"
import { getOptimizedImageUrl } from "@/lib/shopify/image"
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

function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const price = product.priceRange?.minVariantPrice
  const rawUrl = product.featuredImage?.url || null
  console.log("[v0] ProductCard image debug:", { title: product.title, rawUrl, hasFeaturedImage: !!product.featuredImage })
  // Use raw Shopify CDN URL directly - no transforms that could break it
  const imageUrl = rawUrl || null

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F3EF] mb-3">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={priority}
            loading={priority ? undefined : "lazy"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#9B9B9B] text-sm">
            No image
          </div>
        )}
      </div>
      <h3 className="text-xs md:text-sm font-normal text-[#1A1A1A] group-hover:text-[#9E6B73] transition-colors tracking-wide line-clamp-1">
        {product.title}
      </h3>
      {price && (
        <p className="text-xs md:text-sm text-[#1A1A1A] mt-1">
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
          <div className="aspect-[4/5] bg-[#E8E4DC] mb-3" />
          <div className="h-4 bg-[#E8E4DC] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#E8E4DC] rounded w-1/4" />
        </div>
      ))}
    </div>
  )
}

// Keywords for virtual collections that don't exist as Shopify collections
const VIRTUAL_KEYWORDS: Record<string, string[]> = {
  'collagen-masks': ['collagen', 'mask', 'face mask', 'overnight mask', 'sleeping mask', 'sheet mask'],
}

async function CollectionProducts({ handle, priority = false }: { handle: string; priority?: boolean }) {
  if (!isShopifyConfigured) {
    console.log("[v0] Shopify not configured")
    return null
  }
  try {
  let fetched
  if (VIRTUAL_KEYWORDS[handle]) {
    const all = await getAllProducts({})
    console.log("[v0] Virtual collection", handle, "total products:", all.length)
    fetched = all.filter((p) => {
      const text = `${p.title} ${p.description} ${p.tags?.join(' ') || ''} ${p.productType || ''}`.toLowerCase()
      return VIRTUAL_KEYWORDS[handle].some((kw) => text.includes(kw.toLowerCase()))
    })
  } else {
    fetched = await getCollectionProducts({ handle, first: 8 })
  }
  console.log("[v0] Collection", handle, "fetched:", fetched.length, "products. First product image:", fetched[0]?.featuredImage?.url || "NO IMAGE")
  const products = fetched.filter((p) => p.featuredImage?.url).slice(0, 4)
  console.log("[v0] Collection", handle, "after filter:", products.length, "products with images. URLs:", products.map(p => p.featuredImage?.url?.substring(0, 80)))
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
  { handle: "gel-nail-wraps", title: "Gel Nail Wraps", bg: "bg-white" },
  { handle: "french-styles", title: "French Styles", bg: "bg-[#FAFAF8]" },
  { handle: "haircare", title: "Haircare", bg: "bg-white" },
  { handle: "skincare", title: "Skincare", bg: "bg-[#FAFAF8]" },
  { handle: "collagen-masks", title: "Collagen Masks", bg: "bg-white" },
  { handle: "treatments", title: "Treatments", bg: "bg-[#FAFAF8]" },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Announcement Bar */}
      <div className="bg-[#1A1A1A] py-3">
        <p className="text-center text-[11px] font-medium tracking-[0.2em] text-white uppercase">
          Complimentary Shipping on Orders Over $50
        </p>
      </div>

      <DynamicHeader />

      <main>
        {/* Hero */}
        <section className="relative">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-8 md:py-12 lg:py-20">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1">
                <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase mb-3 md:mb-4">
                  New Collection
                </p>
                <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light leading-[0.95] tracking-tight text-[#1A1A1A] mb-4 md:mb-6 text-balance">
                  Effortless
                  <br />
                  <span className="italic">elegance</span>
                  <br />
                  at home
                </h1>
                <p className="text-sm md:text-base text-[#666] leading-relaxed max-w-md mb-6 md:mb-8">
                  Premium semi-cured gel nails, luxury hair care, and refined skincare crafted for the modern woman.
                </p>
                <Link
                  href="/collections"
                  className="inline-flex items-center justify-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-[#1A1A1A] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#9E6B73] transition-colors duration-300 w-full md:w-auto"
                >
                  Shop Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="order-1 lg:order-2">
                <div className="relative aspect-[4/5] bg-[#F5F3EF] overflow-hidden">
                  <Image
                    src="/images/hero.jpg"
                    alt="Elegant hands with premium semi-cured gel nails in soft nude tones"
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Strip */}
        <section className="border-y border-[#E8E4DC] bg-white">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E4DC]">
              <div className="flex items-center justify-center gap-4 py-5">
                <Truck className="w-5 h-5 text-[#9E6B73]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Free Shipping $50+</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-5">
                <RefreshCw className="w-5 h-5 text-[#9E6B73]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">14-Day Returns</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-5">
                <Shield className="w-5 h-5 text-[#9E6B73]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Salon Quality</span>
              </div>
            </div>
          </div>
        </section>

        {/* Collection Sections */}
        {HOMEPAGE_COLLECTIONS.map((col, index) => (
          <section key={col.handle} className={`py-10 md:py-16 lg:py-20 ${col.bg}`}>
            <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4 mb-6 md:mb-10">
                <div>
                  <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase mb-1.5 md:mb-2">
                    Collection
                  </p>
                  <h2 className="font-serif text-xl md:text-3xl lg:text-4xl font-light tracking-tight text-[#1A1A1A]">
                    {col.title}
                  </h2>
                </div>
                <Link
                  href={`/collections/${col.handle}`}
                  className="inline-flex items-center gap-2 text-xs md:text-sm font-medium tracking-[0.1em] text-[#1A1A1A] uppercase hover:text-[#9E6B73] transition-colors"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </Link>
              </div>
              <Suspense fallback={<ProductGridSkeleton />}>
                <CollectionProducts handle={col.handle} priority={index === 0} />
              </Suspense>
            </div>
          </section>
        ))}

        {/* Reviews */}
        <section className="py-10 md:py-16 lg:py-20 bg-[#F5F3EF]">
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
            <div className="text-center mb-8 md:mb-12">
              <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase mb-1.5 md:mb-2">
                Reviews
              </p>
              <h2 className="font-serif text-xl md:text-3xl lg:text-4xl font-light tracking-tight text-[#1A1A1A]">
                What our clients say
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              {[
                { quote: "The quality is absolutely incredible. These gel nails last over two weeks and look salon-fresh.", author: "Sarah M.", location: "Los Angeles" },
                { quote: "Crazy Gels is hands down the best. The application is foolproof and the results are amazing.", author: "Jessica T.", location: "Miami" },
                { quote: "Finally found skincare that actually works. The glow serum has transformed my routine.", author: "Emily R.", location: "New York" },
              ].map((t, i) => (
                <div key={i} className="bg-white p-8">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#9E6B73] text-[#9E6B73]" />
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

        {/* AI Beauty Consultant Highlight */}
        <section className="relative py-12 md:py-20 lg:py-28 bg-[#1A1A1A] overflow-hidden">
          {/* Subtle gold accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#B76E79] to-transparent" />
          {/* Ambient glow */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-[#9E6B73]/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#B76E79]/[0.08] rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />

          <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
            <div className="text-center mb-8 md:mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-[#B76E79]/30 rounded-full mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#B76E79]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                </svg>
                <span className="text-[11px] font-medium tracking-[0.2em] text-[#B76E79] uppercase">AI-Powered</span>
              </div>
              <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-white mb-3 md:mb-4 text-balance">
                Meet Your Personal
                <br />
                <span className="text-[#B76E79]">Beauty Consultant</span>
              </h2>
              <p className="text-white/40 max-w-xl mx-auto text-base leading-relaxed">
                Answer a few questions and receive expert-backed, personalized skincare and haircare recommendations in minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {/* Skin Analysis Card */}
              <Link
                href="/consult/skin"
                className="group relative flex flex-col justify-between border border-white/10 bg-white/[0.03] p-6 md:p-8 lg:p-10 transition-all duration-300 hover:border-[#B76E79]/40 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#B76E79]/10 border border-[#B76E79]/20 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#B76E79]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                    </svg>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-medium text-white mb-2 group-hover:text-[#B76E79] transition-colors">
                    Skin Analysis
                  </h3>
                  <p className="text-white/35 text-sm leading-relaxed mb-6">
                    Discover your skin type, identify concerns, and get a curated routine with products that actually work for you.
                  </p>
                  <ul className="flex flex-wrap gap-2 mb-8">
                    {["Skin type", "Concerns", "Products", "Routine"].map((tag) => (
                      <li key={tag} className="px-3 py-1 text-[10px] font-medium tracking-wider text-[#B76E79]/70 uppercase border border-[#B76E79]/15 rounded-full">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#B76E79] uppercase">
                  Start Analysis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              {/* Hair Analysis Card */}
              <Link
                href="/consult/hair"
                className="group relative flex flex-col justify-between border border-white/10 bg-white/[0.03] p-6 md:p-8 lg:p-10 transition-all duration-300 hover:border-[#9E6B73]/50 hover:bg-white/[0.06]"
              >
                <div>
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-[#9E6B73]/15 border border-[#9E6B73]/25 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-[#C4868F]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" />
                      <path d="M20 16.2A7.5 7.5 0 0 0 14.2 8" />
                      <path d="M17 21.1A10 10 0 0 0 22 12" />
                    </svg>
                  </div>
                  <h3 className="text-xl lg:text-2xl font-medium text-white mb-2 group-hover:text-[#C4868F] transition-colors">
                    Hair Analysis
                  </h3>
                  <p className="text-white/35 text-sm leading-relaxed mb-6">
                    Understand your hair type, assess damage, and receive tailored treatment and styling recommendations.
                  </p>
                  <ul className="flex flex-wrap gap-2 mb-8">
                    {["Hair type", "Damage", "Treatments", "Styling"].map((tag) => (
                      <li key={tag} className="px-3 py-1 text-[10px] font-medium tracking-wider text-[#C4868F]/70 uppercase border border-[#9E6B73]/20 rounded-full">
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#C4868F] uppercase">
                  Start Analysis
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-white/25 text-xs tracking-[0.15em] uppercase">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {'Private & Secure'}
              </span>
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Expert-Backed
              </span>
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {'Free & Instant'}
              </span>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-10 md:py-16 lg:py-20 bg-[#F5F3EF]">
          <div className="max-w-xl mx-auto px-4 md:px-6 text-center">
            <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase mb-1.5 md:mb-2">
              Newsletter
            </p>
            <h2 className="font-serif text-xl md:text-3xl font-light text-[#1A1A1A] mb-3 md:mb-4">
              Join the inner circle
            </h2>
            <p className="text-[#666] mb-5 md:mb-6 text-sm">
              Subscribe for exclusive offers, early access, and beauty tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 bg-white border border-[#E8E4DC] text-[#1A1A1A] placeholder:text-[#9B9B9B] text-sm tracking-wide focus:outline-none focus:border-[#9E6B73]"
              />
              <button
                type="submit"
                className="px-8 py-3 bg-[#1A1A1A] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#9E6B73] transition-colors"
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
