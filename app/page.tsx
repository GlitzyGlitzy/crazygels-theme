import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Sparkles, Heart, Shield, Truck, RefreshCw, Instagram, ArrowRight, Play, ShoppingBag } from "lucide-react"
import { getProducts, getCollections, isShopifyConfigured } from "@/lib/shopify"
import { Product, Collection } from "@/lib/shopify/types"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { ProductGridSkeleton } from "@/components/products/product-grid"
import { CategoryProducts, CategorySectionSkeleton } from "@/components/home/category-products"

function formatPrice(amount: string, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(parseFloat(amount))
}

// Featured Products Component with real Shopify data
async function FeaturedProducts() {
  // Check if Shopify is configured
  if (!isShopifyConfigured) {
    return (
      <div className="text-center py-12 px-4">
        <div className="max-w-md mx-auto bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h3 className="text-[#2C2C2C] font-medium text-lg mb-2">Connect Your Shopify Store</h3>
          <p className="text-[#9B9B9B] text-sm mb-4">
            Add your Shopify credentials to display real products.
          </p>
          <div className="text-left bg-[#FAF7F2] rounded-lg p-4 text-xs font-mono">
            <p className="text-[#9B9B9B] mb-1">Required environment variables:</p>
            <p className="text-[#D4AF37]">SHOPIFY_STORE_DOMAIN</p>
            <p className="text-[#D4AF37]">SHOPIFY_STOREFRONT_ACCESS_TOKEN</p>
          </div>
        </div>
      </div>
    )
  }

  let products: Product[] = []
  let debugError: string | null = null
  
  try {
    products = await getProducts({ first: 8 })
    console.log("[v0] FeaturedProducts: Got", products.length, "products")
  } catch (error: any) {
    debugError = error?.message || error?.extensions?.code || JSON.stringify(error)
    console.log("[v0] FeaturedProducts: Error fetching -", debugError)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-[#9B9B9B]">
        <p>No products found in your Shopify store.</p>
        <p className="text-sm mt-2">Add some products to your store to see them here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => {
        const price = product.priceRange?.minVariantPrice
        const compareAtPrice = product.variants?.[0]?.compareAtPrice
        const hasDiscount = compareAtPrice && price && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)
        const tags = product.tags || []
        const isNew = tags.includes("new") || tags.includes("New")
        const isBestseller = tags.includes("bestseller") || tags.includes("Bestseller")

        return (
          <Link
            key={product.id}
            href={`/products/${product.handle}`}
            className="group"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#FFFEF9] border border-[#D4AF37]/10 mb-4 shadow-sm">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[#C9A9A6]">
                  <ShoppingBag className="w-12 h-12" />
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
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#C9A9A6] hover:text-[#D4AF37] hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                aria-label={`Add ${product.title} to wishlist`}
              >
                <Heart className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <h3 className="text-[#2C2C2C] font-medium mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[#B8860B] font-semibold">
                {formatPrice(price.amount, price.currencyCode)}
              </span>
              {hasDiscount && (
                <span className="text-[#9B9B9B] line-through text-sm">
                  {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
                </span>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

// Collections Component with real Shopify data
async function ShopifyCollections() {
  let collections: Collection[] = []
  
  // Only fetch if Shopify is configured
  if (isShopifyConfigured) {
    try {
      collections = await getCollections()
      // Filter to show only main categories (limit to 3)
      collections = collections.slice(0, 3)
    } catch (error) {
      // Silently fail - use default categories
    }
  }

  const defaultCategories = [
    {
      title: "NAILS",
      subtitle: "Semi-Cured Gel Nail Sets",
      description: "Salon-quality gel nails you can apply at home in minutes. 20+ designs, 14-day wear.",
      href: "/collections/nails",
      color: "#D4AF37",
      features: ["14-Day Wear", "UV Cured", "Easy Apply"]
    },
    {
      title: "HAIR",
      subtitle: "Premium Hair Extensions",
      description: "Clip-in, tape-in, and ponytail extensions in 30+ shades. 100% Remy human hair.",
      href: "/collections/hair",
      color: "#8B7355",
      features: ["100% Remy", "30+ Shades", "Heat Safe"]
    },
    {
      title: "SKIN",
      subtitle: "Refined Skincare",
      description: "Clean, effective skincare for your best glow. Serums, masks, and more.",
      href: "/collections/skin",
      color: "#C9A9A6",
      features: ["Cruelty Free", "Vegan", "Clean Beauty"]
    }
  ]

  // If we have Shopify collections, merge with default styling
  const categories = collections.length > 0
    ? collections.map((col, i) => ({
        title: col.title.toUpperCase(),
        subtitle: col.description?.slice(0, 50) || defaultCategories[i]?.subtitle || "",
        description: col.description || defaultCategories[i]?.description || "",
        image: col.image?.url,
        href: `/collections/${col.handle}`,
        color: defaultCategories[i]?.color || "#D4AF37",
        features: defaultCategories[i]?.features || []
      }))
    : defaultCategories

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link
          key={category.title}
          href={category.href}
          className="group relative overflow-hidden rounded-2xl bg-[#FFFEF9] border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all duration-300 shadow-sm"
        >
          <div className="aspect-[4/5] relative overflow-hidden">
            {category.image ? (
              <Image
                src={category.image}
                alt={category.title}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#E8C4C4]/30 via-[#D4AF37]/20 to-[#FAF7F2]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2C2C2C]/80 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-sm text-white/70 mb-1 tracking-wide">{category.subtitle}</p>
            <h3 className="text-xl font-light tracking-[0.1em] text-white mb-2">
              {category.title}
            </h3>
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{category.description}</p>
            {category.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {category.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 text-xs font-medium tracking-wide rounded-full bg-white/10 text-white/90"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function HomePage() {
  const testimonials = [
    {
      name: "Sarah M.",
      location: "Los Angeles, CA",
      rating: 5,
      text: "I've tried so many gel nail brands and Crazy Gels is hands down the best! They last 2+ weeks and the application is foolproof. Obsessed!",
      product: "French Kiss Gel Set"
    },
    {
      name: "Jessica T.",
      location: "Miami, FL",
      rating: 5,
      text: "The hair extensions are incredible quality. They blend perfectly with my natural hair and I get compliments everywhere I go!",
      product: "Clip-In Extensions"
    },
    {
      name: "Emily R.",
      location: "New York, NY",
      rating: 5,
      text: "Finally found skincare that actually works for my sensitive skin. The glow serum is my holy grail product now!",
      product: "Glow Serum"
    }
  ]

  const instagramPosts = [
    { likes: "2.4k" },
    { likes: "1.8k" },
    { likes: "3.1k" },
    { likes: "2.7k" },
    { likes: "1.5k" },
    { likes: "2.2k" }
  ]

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C2C2C]">
      {/* Announcement Bar */}
      <div className="bg-[#2C2C2C] py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-[#FAF7F2] text-xs font-medium uppercase tracking-[0.2em]">
          <Sparkles className="w-3 h-3 mr-2 text-[#D4AF37]" aria-hidden="true" />
          <span>Complimentary Shipping on Orders Over $50</span>
          <Sparkles className="w-3 h-3 ml-2 text-[#D4AF37]" aria-hidden="true" />
        </div>
      </div>

      {/* Header */}
      <DynamicHeader />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-b from-[#FAF7F2] to-[#FFFEF9]">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#E8C4C4]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                  <span className="text-sm font-medium text-[#2C2C2C]/80 tracking-wide">New Collection Just Arrived</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight mb-6 tracking-tight">
                  <span className="text-[#2C2C2C]">Timeless</span>
                  <br />
                  <span className="text-[#D4AF37] font-medium">Elegance</span>
                  <br />
                  <span className="text-[#2C2C2C]">At Home</span>
                </h1>
                
                <p className="text-lg md:text-xl text-[#2C2C2C]/70 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Premium semi-cured gel nails, luxury hair extensions, and refined skincare. Effortless beauty for the discerning woman.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/collections/nails"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2C2C2C] text-[#FAF7F2] font-medium tracking-wide rounded-full hover:bg-[#D4AF37] transition-colors"
                  >
                    Explore Collection
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/pages/how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#2C2C2C]/20 text-[#2C2C2C] font-medium tracking-wide rounded-full hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
                  >
                    <Play className="w-5 h-5" aria-hidden="true" />
                    How It Works
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-sm text-[#2C2C2C]/70">4.9/5 (2,500+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#2C2C2C]/70">
                    <Truck className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
                    <span>Complimentary Shipping $50+</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E8C4C4]/30 to-[#D4AF37]/20 rounded-3xl blur-2xl" />
                  <div className="relative z-10 aspect-square rounded-3xl bg-gradient-to-br from-[#FFFEF9] to-[#FAF7F2] border border-[#D4AF37]/20 flex items-center justify-center shadow-lg">
                    <div className="text-center p-8">
                      <Sparkles className="w-16 h-16 text-[#D4AF37] mx-auto mb-4" />
                      <p className="text-[#2C2C2C]/50 text-sm">Featured collection coming soon</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 z-20 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl p-4 shadow-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37] flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">14</span>
                      </div>
                      <div>
                        <p className="text-[#2C2C2C] font-medium">Day Wear</p>
                        <p className="text-[#2C2C2C]/50 text-sm">Guaranteed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#FFFEF9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-4">EXPLORE COLLECTIONS</h2>
              <p className="text-[#9B9B9B] text-lg max-w-2xl mx-auto">Curated selections for your beauty ritual</p>
            </div>
            <Suspense fallback={<div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="aspect-[4/5] rounded-2xl bg-[#E8C4C4]/20 animate-pulse" />)}</div>}>
              <ShopifyCollections />
            </Suspense>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#FAF7F2]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-2">MOST LOVED</h2>
                <p className="text-[#9B9B9B]">Customer favorites</p>
              </div>
              <Link 
                href="/collections/all"
                className="hidden md:inline-flex items-center gap-2 text-[#D4AF37] font-medium tracking-wide hover:text-[#B8860B] transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <Suspense fallback={<ProductGridSkeleton count={8} />}>
              <FeaturedProducts />
            </Suspense>

            <div className="mt-8 text-center md:hidden">
              <Link 
                href="/collections/all"
                className="inline-flex items-center gap-2 text-[#D4AF37] font-medium tracking-wide"
              >
                View All Favorites <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Shop by Category - All Products Grouped by Category */}
        <section className="bg-[#FFFEF9]" id="shop-by-category">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-4">SHOP BY CATEGORY</h2>
              <p className="text-[#9B9B9B]">Browse our complete collection</p>
            </div>
          </div>
          <Suspense fallback={
            <div>
              <CategorySectionSkeleton />
              <CategorySectionSkeleton />
              <CategorySectionSkeleton />
            </div>
          }>
            <CategoryProducts />
          </Suspense>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#FAF7F2]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-4">CLIENT TESTIMONIALS</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-[#2C2C2C]/70">4.9 average from 2,500+ reviews</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-[#FFFEF9] border border-[#D4AF37]/10 rounded-xl p-6 shadow-sm">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-[#2C2C2C]/80 mb-4 leading-relaxed italic">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>
                  <div className="border-t border-[#D4AF37]/10 pt-4">
                    <p className="text-[#2C2C2C] font-medium">{testimonial.name}</p>
                    <p className="text-[#9B9B9B] text-sm">{testimonial.location}</p>
                    <p className="text-[#D4AF37] text-sm mt-1">Purchased: {testimonial.product}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram Feed */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#FFFEF9]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-4">
                <Instagram className="inline-block w-6 h-6 mr-2 text-[#D4AF37]" aria-hidden="true" />
                @CRAZYGELS
              </h2>
              <p className="text-[#9B9B9B]">Share your looks with us</p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              {instagramPosts.map((post, i) => (
                <a
                  key={i}
                  href="https://instagram.com/crazygels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-[#E8C4C4]/30 to-[#D4AF37]/20"
                >
                  <div className="absolute inset-0 bg-[#D4AF37]/0 group-hover:bg-[#D4AF37]/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-white font-medium">
                      <Heart className="w-4 h-4 fill-white" aria-hidden="true" />
                      {post.likes}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#FAF7F2]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-light tracking-[0.15em] text-[#2C2C2C] mb-4">THE CRAZY GELS DIFFERENCE</h2>
              <p className="text-[#9B9B9B] text-lg max-w-2xl mx-auto">Exceptional quality meets timeless elegance</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: "Premium Quality", desc: "Only the highest quality materials and formulas", color: "#D4AF37" },
                { icon: Truck, title: "Complimentary Shipping", desc: "Free shipping on orders over $50. 1-5 day delivery", color: "#8B7355" },
                { icon: RefreshCw, title: "Easy Returns", desc: "14-day hassle-free returns. No questions asked", color: "#C9A9A6" },
                { icon: Heart, title: "Cruelty Free", desc: "All products are vegan and never tested on animals", color: "#B8860B" }
              ].map((item, i) => (
                <div key={i} className="text-center p-6">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <item.icon className="w-8 h-8" style={{ color: item.color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-[#2C2C2C] font-medium mb-2">{item.title}</h3>
                  <p className="text-[#9B9B9B] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#2C2C2C]" role="contentinfo">
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-xl md:text-2xl font-light tracking-[0.1em] text-[#FAF7F2] mb-2">
                  JOIN OUR <span className="text-[#D4AF37]">INNER CIRCLE</span>
                </h2>
                <p className="text-[#FAF7F2]/70">Receive exclusive offers and beauty insights</p>
              </div>
              <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto" aria-label="Newsletter signup">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="px-6 py-4 bg-white/5 border border-[#D4AF37]/30 rounded-full text-[#FAF7F2] placeholder:text-[#FAF7F2]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors w-full sm:w-80"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-[#D4AF37] text-[#2C2C2C] font-medium tracking-wide rounded-full hover:bg-[#B8860B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                >
                  SUBSCRIBE
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-block">
                <span className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#FAF7F2]">
                  CRAZY <span className="text-[#D4AF37]">GELS</span>
                </span>
              </Link>
              <p className="text-[#FAF7F2]/70 text-sm leading-relaxed mt-4 mb-6">
                Premium semi-cured gel nails for the discerning woman. Salon-quality elegance at home.
              </p>
              <div className="flex gap-3">
                {[
                  { name: "Instagram", label: "Follow us on Instagram" },
                  { name: "TikTok", label: "Follow us on TikTok" },
                  { name: "Facebook", label: "Follow us on Facebook" }
                ].map((social) => (
                  <a
                    key={social.name}
                    href="#"
                    className="w-10 h-10 rounded-full bg-white/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#FAF7F2]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
                    aria-label={social.label}
                  >
                    <Instagram className="w-5 h-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {[
              { title: "Shop", links: [{ name: "Nails", href: "/collections/nails" }, { name: "Hair", href: "/collections/hair" }, { name: "Skin", href: "/collections/skin" }, { name: "Bundles", href: "/collections/bundles" }, { name: "Sale", href: "/collections/sale" }] },
              { title: "Help", links: [{ name: "FAQ", href: "/pages/faq" }, { name: "Shipping", href: "/pages/shipping" }, { name: "Returns", href: "/pages/returns" }, { name: "Contact", href: "/pages/contact" }] },
              { title: "Company", links: [{ name: "About", href: "/pages/about" }, { name: "Blog", href: "/blogs/news" }, { name: "Careers", href: "/pages/careers" }, { name: "Press", href: "/pages/press" }] }
            ].map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3 className="text-[#FAF7F2] font-medium uppercase tracking-widest text-sm mb-4 md:mb-6">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-[#FAF7F2]/70 hover:text-[#D4AF37] transition-colors text-sm">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#FAF7F2]/50 text-xs text-center md:text-left">
              &copy; 2026 Crazy Gels. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs text-white/70">
              <Link href="/pages/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/pages/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
