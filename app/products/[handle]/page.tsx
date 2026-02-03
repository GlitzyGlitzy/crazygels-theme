"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Star, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Minus, 
  Plus, 
  Heart, 
  Share2, 
  Truck, 
  Shield, 
  RefreshCw, 
  Clock,
  ShoppingBag,
  Menu,
  X,
  Search,
  User,
  ChevronDown,
  Sparkles,
  Instagram,
  ZoomIn
} from "lucide-react"

// Sample product data - in production this would come from Shopify
const product = {
  id: "1",
  title: "French Kiss Gel Nail Set",
  handle: "french-kiss-gel-nail-set",
  price: 24.99,
  compareAtPrice: 34.99,
  currency: "EUR",
  description: "Our bestselling French tip gel nail set featuring a modern twist on the classic look. These semi-cured gel strips deliver salon-quality results in minutes with zero damage to your natural nails.",
  features: [
    "Lasts up to 2 weeks",
    "No UV lamp required (optional for extra durability)",
    "Zero damage to natural nails",
    "Includes 20 nail strips in various sizes",
    "Includes prep pad, nail file, and cuticle stick",
    "Waterproof and chip-resistant"
  ],
  images: [
    "/crazygels-lifestyle.jpg",
    "/crazygels-lifestyle.jpg",
    "/crazygels-lifestyle.jpg",
    "/crazygels-lifestyle.jpg"
  ],
  variants: [
    { id: "1", name: "Classic French", available: true },
    { id: "2", name: "Pink French", available: true },
    { id: "3", name: "Glitter French", available: true },
    { id: "4", name: "Ombre French", available: false }
  ],
  sizes: [
    { id: "xs", name: "XS (Petite)", available: true },
    { id: "s", name: "S (Small)", available: true },
    { id: "m", name: "M (Medium)", available: true },
    { id: "l", name: "L (Large)", available: true }
  ],
  rating: 4.9,
  reviewCount: 2847,
  inStock: true,
  sku: "CG-FRN-001",
  tags: ["French Tips", "Bestseller", "Classic"]
}

const reviews = [
  {
    id: 1,
    author: "Sarah M.",
    rating: 5,
    date: "2 days ago",
    title: "Absolutely obsessed!",
    content: "These are the best gel nails I've ever tried. They went on so easily and have lasted over 2 weeks now with no chips!",
    verified: true
  },
  {
    id: 2,
    author: "Emma R.",
    rating: 5,
    date: "1 week ago",
    title: "Salon quality at home",
    content: "I can't believe how professional these look. My friends keep asking where I got my nails done!",
    verified: true
  },
  {
    id: 3,
    author: "Jessica T.",
    rating: 4,
    date: "2 weeks ago",
    title: "Love them!",
    content: "Great quality and easy to apply. Only giving 4 stars because I wish there were more sizes included.",
    verified: true
  }
]

const relatedProducts = [
  { id: 1, title: "Sunset Ombre Set", price: 22.99, image: "/crazygels-lifestyle.jpg", rating: 4.8 },
  { id: 2, title: "Midnight Sparkle Set", price: 26.99, image: "/crazygels-lifestyle.jpg", rating: 4.9 },
  { id: 3, title: "Nude Collection", price: 21.99, image: "/crazygels-lifestyle.jpg", rating: 4.7 },
  { id: 4, title: "Cherry Red Set", price: 23.99, image: "/crazygels-lifestyle.jpg", rating: 4.8 }
]

export default function ProductPage() {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0].id)
  const [selectedSize, setSelectedSize] = useState(product.sizes[2].id)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"description" | "how-to" | "reviews">("description")
  const [imageZoom, setImageZoom] = useState(false)

  const discount = Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center text-black text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 mr-2" />
            Free Shipping on Orders Over $50
            <Sparkles className="w-3 h-3 ml-2" />
          </div>
        </div>
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-[#ff00b0] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <Link href="/" className="flex-shrink-0">
                <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                  CRAZY GELS
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-1">
                {["Nails", "Hair", "Skin", "Bundles", "Sale"].map((item) => (
                  <Link
                    key={item}
                    href={`/collections/${item.toLowerCase()}`}
                    className={`px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
                      item === "Sale" ? "text-[#ff00b0]" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {item}
                  </Link>
                ))}
              </nav>
              <div className="flex items-center gap-2 md:gap-4">
                <button className="hidden md:flex p-2 text-white/70 hover:text-white transition-colors">
                  <Search className="w-5 h-5" />
                </button>
                <Link href="/account" className="hidden md:flex p-2 text-white/70 hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <Link href="/cart" className="relative p-2 text-white/70 hover:text-white transition-colors">
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff00b0] rounded-full text-[10px] font-bold flex items-center justify-center text-black">
                    0
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[104px] md:h-[120px]" />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-white/50">
          <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/collections/nails" className="hover:text-white transition-colors">Nails</Link></li>
          <li>/</li>
          <li><Link href="/collections/french-tips" className="hover:text-white transition-colors">French Tips</Link></li>
          <li>/</li>
          <li className="text-white">{product.title}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-square rounded-3xl overflow-hidden bg-[#1a1a1a] border border-white/10 cursor-zoom-in group"
              onClick={() => setImageZoom(true)}
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
              
              {/* Sale Badge */}
              {product.compareAtPrice > product.price && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-[#ff00b0] text-black text-sm font-bold rounded-full">
                  -{discount}%
                </div>
              )}

              {/* Zoom Icon */}
              <div className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-5 h-5 text-white" />
              </div>

              {/* Navigation Arrows */}
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length) }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage((prev) => (prev + 1) % product.images.length) }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === index 
                      ? "border-[#ff00b0]" 
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.title} thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span 
                  key={tag}
                  className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                    tag === "Bestseller" 
                      ? "bg-[#ff00b0] text-black" 
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? "fill-[#feca57] text-[#feca57]" : "text-white/20"}`}
                  />
                ))}
              </div>
              <span className="text-white/70">
                {product.rating} ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-black text-[#ff00b0]">
                {product.currency === "EUR" ? "€" : "$"}{product.price.toFixed(2)}
              </span>
              {product.compareAtPrice > product.price && (
                <span className="text-xl text-white/40 line-through">
                  {product.currency === "EUR" ? "€" : "$"}{product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Short Description */}
            <p className="text-white/70 leading-relaxed">
              {product.description}
            </p>

            {/* Variant Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-3">
                  Style: <span className="text-white/60 font-normal normal-case">{product.variants.find(v => v.id === selectedVariant)?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => variant.available && setSelectedVariant(variant.id)}
                      disabled={!variant.available}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedVariant === variant.id
                          ? "bg-[#ff00b0] text-black"
                          : variant.available
                            ? "bg-white/5 border border-white/10 hover:border-white/30"
                            : "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed line-through"
                      }`}
                    >
                      {variant.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold uppercase tracking-wider">
                    Size: <span className="text-white/60 font-normal normal-case">{product.sizes.find(s => s.id === selectedSize)?.name}</span>
                  </label>
                  <button className="text-sm text-[#ff00b0] hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => size.available && setSelectedSize(size.id)}
                      disabled={!size.available}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedSize === size.id
                          ? "bg-[#ff00b0] text-black"
                          : size.available
                            ? "bg-white/5 border border-white/10 hover:border-white/30"
                            : "bg-white/5 border border-white/5 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button className="flex-1 h-12 bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] text-black font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Add to Cart - {product.currency === "EUR" ? "€" : "$"}{(product.price * quantity).toFixed(2)}
              </button>

              {/* Wishlist */}
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                  isWishlisted 
                    ? "bg-[#ff00b0]/20 border-[#ff00b0] text-[#ff00b0]" 
                    : "border-white/10 text-white/70 hover:border-white/30 hover:text-white"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Buy Now */}
            <button className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-colors">
              Buy Now
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              {[
                { icon: Truck, text: "Free shipping over €50" },
                { icon: RefreshCw, text: "30-day returns" },
                { icon: Shield, text: "Secure checkout" },
                { icon: Clock, text: "Ships in 1-2 days" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-3 text-white/60 text-sm">
                  <badge.icon className="w-5 h-5 text-[#ff00b0]" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 pt-4 border-t border-white/10">
              <span className="text-sm text-white/60">Share:</span>
              <div className="flex gap-2">
                {["Facebook", "Twitter", "Pinterest", "Copy Link"].map((platform) => (
                  <button 
                    key={platform}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-all"
                    aria-label={`Share on ${platform}`}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Details Tabs */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-fit mb-8">
          {[
            { id: "description", label: "Description" },
            { id: "how-to", label: "How to Apply" },
            { id: "reviews", label: `Reviews (${product.reviewCount})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[#ff00b0] text-black"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
          {activeTab === "description" && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-black mb-4">Product Details</h3>
                <p className="text-white/70 leading-relaxed">
                  {product.description}
                </p>
              </div>
              
              <div>
                <h3 className="text-2xl font-black mb-4">Features</h3>
                <ul className="grid md:grid-cols-2 gap-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-[#ff00b0] rounded-full flex items-center justify-center mt-0.5">
                        <Check className="w-3 h-3 text-black" />
                      </span>
                      <span className="text-white/70">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-2xl font-black mb-4">{"What's Included"}</h3>
                <ul className="space-y-2 text-white/70">
                  <li>- 20 semi-cured gel nail strips (various sizes)</li>
                  <li>- 1 nail file</li>
                  <li>- 1 cuticle stick</li>
                  <li>- 2 prep pads</li>
                  <li>- Application instructions</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "how-to" && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black">How to Apply Your Gel Nails</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    step: "01",
                    title: "Prep",
                    description: "Clean your nails with the prep pad. Push back cuticles and lightly buff the nail surface."
                  },
                  {
                    step: "02",
                    title: "Apply",
                    description: "Peel the strip and apply to your nail, pressing firmly from cuticle to tip. Trim excess with the file."
                  },
                  {
                    step: "03",
                    title: "Cure",
                    description: "For extra durability, cure under UV/LED lamp for 60 seconds. Otherwise, just press and go!"
                  }
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div className="text-6xl font-black text-[#ff00b0]/20 mb-4">{item.step}</div>
                    <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                    <p className="text-white/60">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-8">
              {/* Rating Summary */}
              <div className="flex flex-col md:flex-row md:items-center gap-8 pb-8 border-b border-white/10">
                <div className="text-center">
                  <div className="text-6xl font-black text-[#ff00b0]">{product.rating}</div>
                  <div className="flex justify-center gap-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-[#feca57] text-[#feca57]" />
                    ))}
                  </div>
                  <div className="text-white/60 mt-2">{product.reviewCount.toLocaleString()} reviews</div>
                </div>
                <div className="flex-1">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-white/60 w-8">{stars} star</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#feca57] rounded-full"
                          style={{ width: stars === 5 ? "85%" : stars === 4 ? "10%" : stars === 3 ? "3%" : "1%" }}
                        />
                      </div>
                      <span className="text-sm text-white/60 w-12 text-right">
                        {stars === 5 ? "85%" : stars === 4 ? "10%" : stars === 3 ? "3%" : "1%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review List */}
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6 bg-white/5 rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{review.author}</span>
                          {review.verified && (
                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                              Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? "fill-[#feca57] text-[#feca57]" : "text-white/20"}`}
                              />
                            ))}
                          </div>
                          <span className="text-white/40 text-sm">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-bold mb-2">{review.title}</h4>
                    <p className="text-white/70">{review.content}</p>
                  </div>
                ))}
              </div>

              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors">
                Load More Reviews
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-black">You May Also Like</h2>
          <Link href="/collections/nails" className="text-[#ff00b0] text-sm font-bold hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {relatedProducts.map((item) => (
            <Link 
              key={item.id} 
              href={`/products/${item.id}`}
              className="group"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a] border border-white/10 mb-4">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button 
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold mb-1 group-hover:text-[#ff00b0] transition-colors">{item.title}</h3>
              <div className="flex items-center gap-2">
                <span className="text-[#ff00b0] font-bold">€{item.price.toFixed(2)}</span>
                <div className="flex items-center gap-1 text-white/60 text-sm">
                  <Star className="w-3 h-3 fill-[#feca57] text-[#feca57]" />
                  {item.rating}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Sticky Add to Cart (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 md:hidden z-40">
        <button className="w-full h-14 bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] text-black font-bold rounded-xl flex items-center justify-center gap-2">
          <ShoppingBag className="w-5 h-5" />
          Add to Cart - €{(product.price * quantity).toFixed(2)}
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-[#050505] border-t border-white/10 py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link href="/" className="inline-block mb-4">
            <span className="text-2xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
              CRAZY GELS
            </span>
          </Link>
          <p className="text-white/40 text-sm">
            © 2026 Crazy Gels. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Image Zoom Modal */}
      {imageZoom && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setImageZoom(false)}
        >
          <button 
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setImageZoom(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative w-full max-w-4xl aspect-square">
            <Image
              src={product.images[selectedImage]}
              alt={product.title}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setSelectedImage(index) }}
                className={`w-3 h-3 rounded-full transition-all ${
                  selectedImage === index ? "bg-[#ff00b0] w-8" : "bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
