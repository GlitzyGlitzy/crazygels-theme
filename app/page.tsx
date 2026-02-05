import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ArrowRight, Truck, Shield, RefreshCw } from "lucide-react"
import { getCollections, getCollectionProducts, isShopifyConfigured, getProducts } from "@/lib/shopify"
import { Product } from "@/lib/shopify/types"
import { getOptimizedImageUrl } from "@/lib/shopify/image"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"

function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount))
}

// --- Product Card ---
function ProductCard({ product }: { product: Product }) {
  const price = product.priceRange?.minVariantPrice
  const firstVariant = product.variants?.edges?.[0]?.node
  const compareAtPrice = firstVariant?.compareAtPrice
  const hasDiscount = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)

  const imageUrl = product.featuredImage?.url
    ? getOptimizedImageUrl(product.featuredImage.url, { width: 500, height: 625, crop: 'center' })
    : null

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#F5F3EF] mb-4">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        )}
        {hasDiscount && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-medium tracking-[0.15em] uppercase">
            Sale
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-normal text-[#1A1A1A] group-hover:text-[#8B7355] transition-colors tracking-wide line-clamp-2">
          {product.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#1A1A1A]">
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-[#9B9B9B] line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// --- Skeletons ---
function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-[#E8E4DC] mb-4" />
      <div className="space-y-2">
        <div className="h-4 bg-[#E8E4DC] rounded w-3/4" />
        <div className="h-4 bg-[#E8E4DC] rounded w-1/4" />
      </div>
    </div>
  )
}

function CollectionSkeleton() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="animate-pulse mb-12">
          <div className="h-3 bg-[#E8E4DC] rounded w-32 mb-3" />
          <div className="h-10 bg-[#E8E4DC] rounded w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function HeroImagesSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-8 aspect-[3/4] bg-[#E8E4DC] animate-pulse" />
      <div className="col-span-4 flex flex-col gap-3">
        <div className="flex-1 bg-[#E8E4DC] animate-pulse" />
        <div className="flex-1 bg-[#E8E4DC] animate-pulse" />
      </div>
    </div>
  )
}

// --- Async Data Components ---

async function HeroImages() {
  if (!isShopifyConfigured) {
    return (
      <div className="aspect-[4/5] bg-gradient-to-br from-[#F5F3EF] to-[#E8E4DC] flex items-center justify-center">
        <p className="text-[#9B9B9B] text-sm tracking-wide">Connect Shopify to display products</p>
      </div>
    )
  }

  let heroProducts: Product[] = []
  try {
    const products = await getProducts({ first: 6 })
    heroProducts = products.filter(p => p.featuredImage?.url).slice(0, 3)
  } catch {
    heroProducts = []
  }

  if (heroProducts.length < 3) {
    return (
      <div className="aspect-[4/5] bg-gradient-to-br from-[#F5F3EF] to-[#E8E4DC] flex items-center justify-center">
        <p className="text-[#9B9B9B] text-sm tracking-wide">Products loading...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-8 aspect-[3/4] relative overflow-hidden bg-[#F5F3EF]">
        <Image
          src={getOptimizedImageUrl(heroProducts[0].featuredImage!.url, { width: 800, height: 1000, crop: 'center' })}
          alt={heroProducts[0].featuredImage?.altText || heroProducts[0].title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 70vw, 40vw"
        />
      </div>
      <div className="col-span-4 flex flex-col gap-3">
        <div className="flex-1 relative overflow-hidden bg-[#F5F3EF]">
          <Image
            src={getOptimizedImageUrl(heroProducts[1].featuredImage!.url, { width: 400, height: 500, crop: 'center' })}
            alt={heroProducts[1].featuredImage?.altText || heroProducts[1].title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 30vw, 15vw"
          />
        </div>
        <div className="flex-1 relative overflow-hidden bg-[#F5F3EF]">
          <Image
            src={getOptimizedImageUrl(heroProducts[2].featuredImage!.url, { width: 400, height: 500, crop: 'center' })}
            alt={heroProducts[2].featuredImage?.altText || heroProducts[2].title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 30vw, 15vw"
          />
        </div>
      </div>
    </div>
  )
}

async function FeaturedCollection() {
  if (!isShopifyConfigured) return null

  try {
    const collections = await getCollections()
    const nailCollection = collections.find(c =>
      c.handle.includes('nail') || c.handle.includes('gel')
    )

    if (!nailCollection) return null

    // Only fetch limited products - NOT all products
    const products = await getCollectionProducts({ handle: nailCollection.handle, first: 8 })
    const productsWithImages = products.filter(p => p.featuredImage?.url)

    if (productsWithImages.length === 0) return null

    return (
      <section className="py-20 lg:py-28">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
                Featured Collection
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-[#1A1A1A] text-balance">
                {nailCollection.title}
              </h2>
            </div>
            <Link
              href={`/collections/${nailCollection.handle}`}
              className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#1A1A1A] uppercase hover:text-[#8B7355] transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {productsWithImages.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    )
  } catch {
    return null
  }
}

async function EditorialBanner() {
  let bannerImage: string | null = null

  if (isShopifyConfigured) {
    try {
      const products = await getProducts({ first: 1 })
      const firstProduct = products.find(p => p.featuredImage?.url)
      bannerImage = firstProduct?.featuredImage?.url
        ? getOptimizedImageUrl(firstProduct.featuredImage.url, { width: 1920, height: 1080, crop: 'center' })
        : null
    } catch {
      bannerImage = null
    }
  }

  return (
    <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {bannerImage ? (
        <Image
          src={bannerImage}
          alt="Featured beauty product"
          fill
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8E4DC] to-[#D4CFC5]" />
      )}
      <div className="absolute inset-0 bg-[#1A1A1A]/40" />
      <div className="absolute inset-0 flex items-center justify-center text-center px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-medium tracking-[0.3em] text-white/80 uppercase mb-6">
            The Art of Self-Care
          </p>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-8 text-balance">
            Beauty that
            <br />
            <span className="italic">empowers</span>
          </h2>
          <Link
            href="/collections"
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#F5F3EF] transition-colors"
          >
            Discover More
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

async function OtherCollections() {
  if (!isShopifyConfigured) return null

  try {
    const collections = await getCollections()
    const nailHandle = collections.find(c =>
      c.handle.includes('nail') || c.handle.includes('gel')
    )?.handle

    const otherCollections = collections.filter(c =>
      !c.handle.includes('frontpage') &&
      c.handle !== 'all' &&
      c.handle !== nailHandle
    ).slice(0, 4) // Limit to 4 other collections

    if (otherCollections.length === 0) return null

    // Fetch limited products per collection in parallel
    const collectionsWithProducts = await Promise.all(
      otherCollections.map(async (collection) => {
        try {
          const products = await getCollectionProducts({ handle: collection.handle, first: 8 })
          return { collection, products: products.filter(p => p.featuredImage?.url) }
        } catch {
          return { collection, products: [] as Product[] }
        }
      })
    )

    const nonEmpty = collectionsWithProducts.filter(r => r.products.length > 0)
    if (nonEmpty.length === 0) return null

    return (
      <>
        {nonEmpty.map((collectionData, index) => (
          <section key={collectionData.collection.handle} className={`py-20 lg:py-28 ${index % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
                    Collection
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-[#1A1A1A] text-balance">
                    {collectionData.collection.title}
                  </h2>
                  {collectionData.collection.description && (
                    <p className="text-[#666] mt-3 max-w-lg text-pretty">{collectionData.collection.description}</p>
                  )}
                </div>
                <Link
                  href={`/collections/${collectionData.collection.handle}`}
                  className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#1A1A1A] uppercase hover:text-[#8B7355] transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
                {collectionData.products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        ))}
      </>
    )
  } catch {
    return null
  }
}

// --- Main Page ---

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Announcement Bar */}
      <div className="bg-[#1A1A1A] py-3">
        <p className="text-center text-[11px] font-medium tracking-[0.2em] text-white uppercase">
          Complimentary Shipping on Orders Over $50
        </p>
      </div>

      {/* Header */}
      <Suspense fallback={<div className="h-16 md:h-20 bg-[#FAF7F2] border-b border-[#D4AF37]/20" />}>
        <DynamicHeader />
      </Suspense>

      <main>
        {/* Hero Section */}
        <section className="relative">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left - Typography (static) */}
              <div className="order-2 lg:order-1">
                <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-6">
                  New Collection
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[0.95] tracking-[-0.02em] text-[#1A1A1A] mb-8 text-balance">
                  Effortless
                  <br />
                  <span className="italic">elegance</span>
                  <br />
                  at home
                </h1>
                <p className="text-base md:text-lg text-[#666] leading-relaxed max-w-md mb-10">
                  Premium semi-cured gel nails, luxury hair extensions, and refined skincare crafted for the modern woman.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/collections"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1A1A1A] text-white text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#8B7355] transition-colors duration-300"
                  >
                    Shop Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/pages/about"
                    className="inline-flex items-center justify-center gap-3 px-8 py-4 border border-[#1A1A1A] text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300"
                  >
                    Our Story
                  </Link>
                </div>
              </div>

              {/* Right - Hero Images (streamed) */}
              <div className="order-1 lg:order-2">
                <Suspense fallback={<HeroImagesSkeleton />}>
                  <HeroImages />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar (static) */}
        <section className="border-y border-[#E8E4DC] bg-white">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E8E4DC]">
              <div className="flex items-center justify-center gap-4 py-6">
                <Truck className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Free Shipping $50+</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-6">
                <RefreshCw className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">14-Day Returns</span>
              </div>
              <div className="flex items-center justify-center gap-4 py-6">
                <Shield className="w-5 h-5 text-[#8B7355]" />
                <span className="text-xs font-medium tracking-[0.15em] text-[#1A1A1A] uppercase">Salon Quality</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Collection */}
        <Suspense fallback={<CollectionSkeleton />}>
          <FeaturedCollection />
        </Suspense>

        {/* Editorial Banner */}
        <Suspense fallback={<section className="relative h-[70vh] min-h-[500px] overflow-hidden bg-[#E8E4DC] animate-pulse" />}>
          <EditorialBanner />
        </Suspense>

        {/* Other Collections */}
        <Suspense fallback={<CollectionSkeleton />}>
          <OtherCollections />
        </Suspense>

        {/* Testimonials (static) */}
        <section className="py-20 lg:py-28 bg-[#F5F3EF]">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
                Reviews
              </p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-[#1A1A1A]">
                What our clients say
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: "The quality is absolutely incredible. These gel nails last over two weeks and look salon-fresh the entire time.",
                  author: "Sarah M.",
                  location: "Los Angeles"
                },
                {
                  quote: "I've tried every brand out there. Crazy Gels is hands down the best. The application is foolproof.",
                  author: "Jessica T.",
                  location: "Miami"
                },
                {
                  quote: "Finally found skincare that actually works. The glow serum has completely transformed my routine.",
                  author: "Emily R.",
                  location: "New York"
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-white p-8 lg:p-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-[#8B7355] text-[#8B7355]" />
                    ))}
                  </div>
                  <p className="text-[#1A1A1A] leading-relaxed mb-6 text-lg font-light italic">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-medium text-[#1A1A1A]">{testimonial.author}</p>
                    <p className="text-xs text-[#9B9B9B] tracking-wide">{testimonial.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter (static) */}
        <section className="py-20 lg:py-28 bg-[#1A1A1A]">
          <div className="max-w-xl mx-auto px-6 text-center">
            <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
              Newsletter
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
              Join the inner circle
            </h2>
            <p className="text-white/60 mb-8">
              Subscribe for exclusive offers, early access to new collections, and beauty tips.
            </p>
            <form className="flex flex-col sm:flex-row gap-3">
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input
                id="newsletter-email"
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-4 bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm tracking-wide focus:outline-none focus:border-[#8B7355]"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-white text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#F5F3EF] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
