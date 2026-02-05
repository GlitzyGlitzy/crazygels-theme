import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ArrowRight, Truck, Shield, RefreshCw } from "lucide-react"
import { getProducts, getCollections, getCollectionProducts, isShopifyConfigured } from "@/lib/shopify"
import { Product, Collection } from "@/lib/shopify/types"
import { getOptimizedImageUrl } from "@/lib/shopify/image"
import { DynamicHeader } from "@/components/layout/dynamic-header"

function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount))
}

// Fetch hero products (3 featured products for the hero grid)
async function getHeroProducts(): Promise<Product[]> {
  if (!isShopifyConfigured) return []
  try {
    const products = await getProducts({ first: 6 })
    return products.filter(p => p.featuredImage?.url).slice(0, 3)
  } catch {
    return []
  }
}

// Fetch collection with products for showcase
async function getCollectionWithProducts(handle: string): Promise<{ collection: Collection | null; products: Product[] }> {
  if (!isShopifyConfigured) return { collection: null, products: [] }
  try {
    const collections = await getCollections()
    const collection = collections.find(c => c.handle.toLowerCase().includes(handle))
    if (!collection) return { collection: null, products: [] }
    
    const products = await getCollectionProducts({ handle: collection.handle, first: 8 })
    return { collection, products: products.filter(p => p.featuredImage?.url) }
  } catch {
    return { collection: null, products: [] }
  }
}

// Product Card Component
function ProductCard({ product, size = "default" }: { product: Product; size?: "default" | "large" }) {
  const price = product.priceRange?.minVariantPrice
  const compareAtPrice = product.variants?.[0]?.compareAtPrice
  const hasDiscount = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)
  
  const imageUrl = product.featuredImage?.url 
    ? getOptimizedImageUrl(product.featuredImage.url, { 
        width: size === "large" ? 800 : 500, 
        height: size === "large" ? 1000 : 625, 
        crop: 'center' 
      })
    : null

  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className={`relative ${size === "large" ? "aspect-[4/5]" : "aspect-[4/5]"} overflow-hidden bg-[#F5F3EF] mb-4`}>
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={product.featuredImage?.altText || product.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes={size === "large" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          />
        )}
        {hasDiscount && (
          <div className="absolute top-4 left-4 px-3 py-1.5 bg-[#1A1A1A] text-white text-[10px] font-medium tracking-[0.15em] uppercase">
            Sale
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-normal text-[#1A1A1A] group-hover:text-[#8B7355] transition-colors tracking-wide">
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

export default async function HomePage() {
  // Fetch data in parallel
  const [heroProducts, nailsData, allProducts] = await Promise.all([
    getHeroProducts(),
    getCollectionWithProducts("nail"),
    isShopifyConfigured ? getProducts({ first: 12 }) : Promise.resolve([])
  ])

  const featuredProducts = allProducts.filter(p => p.featuredImage?.url).slice(0, 8)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Announcement Bar */}
      <div className="bg-[#1A1A1A] py-3">
        <p className="text-center text-[11px] font-medium tracking-[0.2em] text-white uppercase">
          Complimentary Shipping on Orders Over $50
        </p>
      </div>

      {/* Header */}
      <DynamicHeader />

      <main>
        {/* Hero Section - Editorial Style */}
        <section className="relative">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left - Typography */}
              <div className="order-2 lg:order-1">
                <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-6">
                  New Collection
                </p>
                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-light leading-[0.95] tracking-[-0.02em] text-[#1A1A1A] mb-8">
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
                    href="/collections/nails"
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

              {/* Right - Hero Image Grid */}
              <div className="order-1 lg:order-2">
                {heroProducts.length >= 3 ? (
                  <div className="grid grid-cols-12 gap-3">
                    {/* Main large image */}
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
                    {/* Stacked smaller images */}
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
                ) : (
                  <div className="aspect-[4/5] bg-gradient-to-br from-[#F5F3EF] to-[#E8E4DC] flex items-center justify-center">
                    <p className="text-[#9B9B9B] text-sm tracking-wide">Connect Shopify to display products</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
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

        {/* Featured Collection - Nails */}
        {nailsData.products.length > 0 && (
          <section className="py-20 lg:py-28">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
                    Featured Collection
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-[#1A1A1A]">
                    {nailsData.collection?.title || "Nail Collection"}
                  </h2>
                </div>
                <Link 
                  href={`/collections/${nailsData.collection?.handle || "nails"}`}
                  className="inline-flex items-center gap-2 text-sm font-medium tracking-[0.1em] text-[#1A1A1A] uppercase hover:text-[#8B7355] transition-colors"
                >
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {nailsData.products.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Editorial Banner */}
        <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
          {featuredProducts[0]?.featuredImage?.url ? (
            <Image
              src={getOptimizedImageUrl(featuredProducts[0].featuredImage.url, { width: 1920, height: 1080, crop: 'center' })}
              alt="Featured product"
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
              <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-8">
                Beauty that
                <br />
                <span className="italic">empowers</span>
              </h2>
              <Link
                href="/collections/nails"
                className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#F5F3EF] transition-colors"
              >
                Discover More
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* All Products Grid */}
        {featuredProducts.length > 0 && (
          <section className="py-20 lg:py-28 bg-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
              <div className="text-center mb-16">
                <p className="text-[11px] font-medium tracking-[0.3em] text-[#8B7355] uppercase mb-3">
                  Curated Selection
                </p>
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light tracking-[-0.02em] text-[#1A1A1A]">
                  Bestsellers
                </h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                {featuredProducts.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href="/collections/all"
                  className="inline-flex items-center gap-3 px-8 py-4 border border-[#1A1A1A] text-[#1A1A1A] text-sm font-medium tracking-[0.1em] uppercase hover:bg-[#1A1A1A] hover:text-white transition-colors duration-300"
                >
                  View All Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
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
                    "{testimonial.quote}"
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

        {/* Newsletter */}
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
              <input
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
      <footer className="bg-[#FAFAF8] border-t border-[#E8E4DC]">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-2xl font-serif tracking-wide text-[#1A1A1A]">
                CrazyGels
              </Link>
              <p className="text-sm text-[#666] mt-4 leading-relaxed">
                Premium beauty products crafted for the modern woman.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium tracking-[0.2em] text-[#1A1A1A] uppercase mb-4">Shop</h4>
              <ul className="space-y-3">
                {["Nails", "Hair", "Skincare", "Bundles", "Sale"].map((item) => (
                  <li key={item}>
                    <Link href={`/collections/${item.toLowerCase()}`} className="text-sm text-[#666] hover:text-[#1A1A1A] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium tracking-[0.2em] text-[#1A1A1A] uppercase mb-4">Help</h4>
              <ul className="space-y-3">
                {["FAQ", "Shipping", "Returns", "Contact"].map((item) => (
                  <li key={item}>
                    <Link href={`/pages/${item.toLowerCase()}`} className="text-sm text-[#666] hover:text-[#1A1A1A] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium tracking-[0.2em] text-[#1A1A1A] uppercase mb-4">Follow</h4>
              <ul className="space-y-3">
                {["Instagram", "TikTok", "Pinterest", "YouTube"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-sm text-[#666] hover:text-[#1A1A1A] transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-[#E8E4DC] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#9B9B9B]">
              © 2026 CrazyGels. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link href="/pages/privacy" className="text-xs text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/pages/terms" className="text-xs text-[#9B9B9B] hover:text-[#1A1A1A] transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
