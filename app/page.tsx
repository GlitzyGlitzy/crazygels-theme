import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Sparkles, Heart, Shield, Truck, RefreshCw, Instagram, ArrowRight, Play, ShoppingBag } from "lucide-react"
import { getProducts, getCollections, isShopifyConfigured } from "@/lib/shopify"
import { Product, Collection } from "@/lib/shopify/types"
import { Header } from "@/components/layout/header"
import { ProductGridSkeleton } from "@/components/products/product-grid"

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
        <div className="max-w-md mx-auto bg-[#111111] border border-white/10 rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-[#ff00b0]/20 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8 text-[#ff00b0]" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Connect Your Shopify Store</h3>
          <p className="text-white/60 text-sm mb-4">
            Add your Shopify credentials to display real products.
          </p>
          <div className="text-left bg-black/50 rounded-lg p-4 text-xs font-mono">
            <p className="text-white/40 mb-1">Required environment variables:</p>
            <p className="text-[#06b6d4]">SHOPIFY_STORE_DOMAIN</p>
            <p className="text-[#06b6d4]">SHOPIFY_STOREFRONT_ACCESS_TOKEN</p>
          </div>
        </div>
      </div>
    )
  }

  let products: Product[] = []
  
  try {
    products = await getProducts({ first: 8 })
  } catch (error) {
    // Silently fail - show empty state
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-white/60">
        <p>No products found in your Shopify store.</p>
        <p className="text-sm mt-2">Add some products to your store to see them here.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => {
        const price = product.priceRange.minVariantPrice
        const compareAtPrice = product.variants.edges[0]?.node.compareAtPrice
        const hasDiscount = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount)
        const isNew = product.tags.includes("new") || product.tags.includes("New")
        const isBestseller = product.tags.includes("bestseller") || product.tags.includes("Bestseller")

        return (
          <Link
            key={product.id}
            href={`/products/${product.handle}`}
            className="group"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111111] border border-white/10 mb-4">
              {product.featuredImage ? (
                <Image
                  src={product.featuredImage.url}
                  alt={product.featuredImage.altText || product.title}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/40">
                  <ShoppingBag className="w-12 h-12" />
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
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-[#ff00b0] hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                aria-label={`Add ${product.title} to wishlist`}
              >
                <Heart className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <h3 className="text-white font-bold mb-1 group-hover:text-[#ff00b0] transition-colors line-clamp-2">
              {product.title}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[#ff00b0] font-bold">
                {formatPrice(price.amount, price.currencyCode)}
              </span>
              {hasDiscount && (
                <span className="text-white/50 line-through text-sm">
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
      color: "#ff00b0",
      features: ["14-Day Wear", "UV Cured", "Easy Apply"]
    },
    {
      title: "HAIR",
      subtitle: "Premium Hair Extensions",
      description: "Clip-in, tape-in, and ponytail extensions in 30+ shades. 100% Remy human hair.",
      href: "/collections/hair",
      color: "#7c3aed",
      features: ["100% Remy", "30+ Shades", "Heat Safe"]
    },
    {
      title: "SKIN",
      subtitle: "Glow-Up Skincare",
      description: "Clean, effective skincare for your best glow. Serums, masks, and more.",
      href: "/collections/skin",
      color: "#06b6d4",
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
        color: defaultCategories[i]?.color || "#ff00b0",
        features: defaultCategories[i]?.features || []
      }))
    : defaultCategories

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {categories.map((category) => (
        <Link
          key={category.title}
          href={category.href}
          className="group relative overflow-hidden rounded-3xl bg-[#111111] border border-white/10 hover:border-white/20 transition-all duration-300"
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
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 via-[#7c3aed]/20 to-[#06b6d4]/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-sm text-white/60 mb-1">{category.subtitle}</p>
            <h3 className="text-2xl font-black text-white mb-2" style={{ color: category.color }}>
              {category.title}
            </h3>
            <p className="text-white/70 text-sm mb-4 line-clamp-2">{category.description}</p>
            {category.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {category.features.map((feature) => (
                  <span
                    key={feature}
                    className="px-3 py-1 text-xs font-bold rounded-full bg-white/10 text-white/90"
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
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3 h-3 mr-2" aria-hidden="true" />
          <span>Free Shipping on Orders Over $50 | Use Code CRAZY20 for 20% Off</span>
          <Sparkles className="w-3 h-3 ml-2" aria-hidden="true" />
        </div>
      </div>

      {/* Header */}
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 via-[#0a0a0a] to-[#7c3aed]/20" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff00b0]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-6">
                  <Sparkles className="w-4 h-4 text-[#feca57]" aria-hidden="true" />
                  <span className="text-sm font-medium text-white/90">New Collection Just Dropped</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6">
                  <span className="text-white">SALON</span>
                  <br />
                  <span className="bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] bg-clip-text text-transparent">QUALITY</span>
                  <br />
                  <span className="text-white">AT HOME</span>
                </h1>
                
                <p className="text-lg md:text-xl text-white/80 mb-8 max-w-lg mx-auto lg:mx-0">
                  Premium semi-cured gel nails, luxury hair extensions, and glow-up skincare. Look expensive without the salon price tag.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link
                    href="/collections/nails"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] text-white font-bold text-lg rounded-full hover:opacity-90 transition-opacity"
                  >
                    Shop Nails
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/pages/how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/20 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Play className="w-5 h-5" aria-hidden="true" />
                    How It Works
                  </Link>
                </div>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 mt-10">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#feca57] fill-[#feca57]" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="text-sm text-white/80">4.9/5 (2,500+ reviews)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Truck className="w-4 h-4 text-[#06b6d4]" aria-hidden="true" />
                    <span>Free Shipping $50+</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/30 to-[#7c3aed]/30 rounded-3xl blur-2xl" />
                  <div className="relative z-10 aspect-square rounded-3xl bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Sparkles className="w-16 h-16 text-[#ff00b0] mx-auto mb-4" />
                      <p className="text-white/60 text-sm">Featured product images coming soon</p>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -left-4 z-20 bg-[#111111] border border-white/10 rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#ff00b0] to-[#7c3aed] flex items-center justify-center">
                        <span className="text-white font-black text-lg">14</span>
                      </div>
                      <div>
                        <p className="text-white font-bold">Day Wear</p>
                        <p className="text-white/60 text-sm">Guaranteed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">SHOP BY CATEGORY</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">Everything you need for your ultimate glow-up</p>
            </div>
            <Suspense fallback={<div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="aspect-[4/5] rounded-3xl bg-[#111111] animate-pulse" />)}</div>}>
              <ShopifyCollections />
            </Suspense>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">BESTSELLERS</h2>
                <p className="text-white/70">Our most-loved products</p>
              </div>
              <Link 
                href="/collections/all"
                className="hidden md:inline-flex items-center gap-2 text-[#ff00b0] font-bold hover:underline"
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
                className="inline-flex items-center gap-2 text-[#ff00b0] font-bold"
              >
                View All Bestsellers <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">WHAT THEY&apos;RE SAYING</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#feca57] fill-[#feca57]" aria-hidden="true" />
                  ))}
                </div>
                <span className="text-white/80">4.9 average from 2,500+ reviews</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, i) => (
                <div key={i} className="bg-[#111111] border border-white/10 rounded-2xl p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-[#feca57] fill-[#feca57]" aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="text-white/90 mb-4 leading-relaxed">
                    &ldquo;{testimonial.text}&rdquo;
                  </blockquote>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-white font-bold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.location}</p>
                    <p className="text-[#ff00b0] text-sm mt-1">Purchased: {testimonial.product}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instagram Feed */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                <Instagram className="inline-block w-8 h-8 mr-2" aria-hidden="true" />
                @CRAZYGELS
              </h2>
              <p className="text-white/70">Tag us in your looks for a chance to be featured</p>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              {instagramPosts.map((post, i) => (
                <a
                  key={i}
                  href="https://instagram.com/crazygels"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20"
                >
                  <div className="absolute inset-0 bg-[#ff00b0]/0 group-hover:bg-[#ff00b0]/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-white font-bold">
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
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">WHY CRAZY GELS?</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">We&apos;re on a mission to make salon-quality beauty accessible to everyone</p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Shield, title: "Premium Quality", desc: "Only the highest quality materials and formulas", color: "#ff00b0" },
                { icon: Truck, title: "Fast Shipping", desc: "Free shipping on orders over $50. 1-5 day delivery", color: "#7c3aed" },
                { icon: RefreshCw, title: "Easy Returns", desc: "14-day hassle-free returns. No questions asked", color: "#06b6d4" },
                { icon: Heart, title: "Cruelty Free", desc: "All products are vegan and never tested on animals", color: "#feca57" }
              ].map((item, i) => (
                <div key={i} className="text-center p-6">
                  <div 
                    className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <item.icon className="w-8 h-8" style={{ color: item.color }} aria-hidden="true" />
                  </div>
                  <h3 className="text-white font-bold mb-2">{item.title}</h3>
                  <p className="text-white/70 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/10" role="contentinfo">
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h2 className="text-2xl md:text-3xl font-black text-white mb-2">
                  JOIN THE <span className="text-[#ff00b0]">CRAZY</span> CREW
                </h2>
                <p className="text-white/80">Get exclusive deals, nail tips & early access to new designs</p>
              </div>
              <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto" aria-label="Newsletter signup">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input
                  id="newsletter-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  className="px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/50 focus:outline-none focus:border-[#ff00b0] focus:ring-2 focus:ring-[#ff00b0]/20 transition-colors w-full sm:w-80"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] text-white font-bold rounded-full hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#ff00b0]/50"
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
                <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                  CRAZY GELS
                </span>
              </Link>
              <p className="text-white/80 text-sm leading-relaxed mt-4 mb-6">
                Premium semi-cured gel nails for the modern woman. Salon-quality results at home.
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
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:text-[#ff00b0] hover:border-[#ff00b0]/50 transition-all"
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
                <h3 className="text-white font-bold uppercase tracking-wider mb-4 md:mb-6">{col.title}</h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link href={link.href} className="text-white/80 hover:text-[#ff00b0] transition-colors text-sm">
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
            <p className="text-white/70 text-xs text-center md:text-left">
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
