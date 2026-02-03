"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, Check, ChevronLeft, ChevronRight, Sparkles, Heart, Shield, Truck, RefreshCw, Instagram, Menu, X, ShoppingBag, Search, User, ChevronDown, Minus, Plus, Share2 } from "lucide-react"

// This is a PREVIEW of how your Shopify product page will look with the new styling
// The actual styling is in /assets/crazygels-modern-product.css for your Shopify theme

export default function ShopifyProductPagePreview() {
  const [selectedSize, setSelectedSize] = useState("M")
  const [selectedStyle, setSelectedStyle] = useState("French Kiss")
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("description")
  const [isWishlisted, setIsWishlisted] = useState(false)

  const menuItems = [
    {
      label: "Nails",
      href: "/collections/nails",
      submenu: [
        { label: "All Nail Sets", href: "/collections/nails" },
        { label: "French Tips", href: "/collections/french-tips" },
        { label: "Solid Colors", href: "/collections/solid-colors" },
        { label: "Glitter & Sparkle", href: "/collections/glitter" },
        { label: "Nail Art", href: "/collections/nail-art" },
        { label: "New Arrivals", href: "/collections/new-nails" }
      ]
    },
    {
      label: "Hair",
      href: "/collections/hair",
      submenu: [
        { label: "All Hair Products", href: "/collections/hair" },
        { label: "Hair Extensions", href: "/collections/hair-extensions" },
        { label: "Hair Care", href: "/collections/hair-care" },
        { label: "Styling Tools", href: "/collections/styling-tools" }
      ]
    },
    {
      label: "Skin",
      href: "/collections/skin",
      submenu: [
        { label: "All Skin Products", href: "/collections/skin" },
        { label: "Face Care", href: "/collections/face-care" },
        { label: "Body Care", href: "/collections/body-care" },
        { label: "Lip Care", href: "/collections/lip-care" }
      ]
    },
    { label: "Bundles", href: "/collections/bundles" },
    { label: "Sale", href: "/collections/sale", highlight: true }
  ]

  const product = {
    title: "French Kiss Gel Nail Set",
    price: 24.99,
    comparePrice: 34.99,
    rating: 4.9,
    reviewCount: 2847,
    description: "Our bestselling French Kiss gel nail set features a timeless French tip design with a modern twist. Made with real gel formula that cures under UV/LED light for a salon-quality manicure that lasts up to 2 weeks.",
    features: [
      "Lasts up to 2 weeks",
      "Zero damage to natural nails",
      "Easy 10-minute application",
      "Includes nail file & prep pad",
      "16 nail strips per set"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    styles: [
      { name: "French Kiss", color: "#ffeef5" },
      { name: "Blush Pink", color: "#ffb6c1" },
      { name: "Classic Red", color: "#dc143c" },
      { name: "Midnight Black", color: "#1a1a1a" }
    ],
    images: [
      "/crazygels-lifestyle.jpg",
      "/crazygels-lifestyle.jpg",
      "/crazygels-lifestyle.jpg",
      "/crazygels-lifestyle.jpg"
    ]
  }

  const discount = Math.round((1 - product.price / product.comparePrice) * 100)

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-center text-black text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3 mr-2" />
            Free Shipping on Orders Over $50
            <Sparkles className="w-3 h-3 ml-2" />
          </div>
        </div>

        {/* Main Header */}
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Mobile Menu Button */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white hover:text-[#ff00b0] transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {/* Logo */}
              <Link href="/" className="flex-shrink-0">
                <span className="text-xl md:text-2xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                  CRAZY GELS
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {menuItems.map((item) => (
                  <div 
                    key={item.label}
                    className="relative"
                    onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                    onMouseLeave={() => setActiveDropdown(null)}
                  >
                    <Link
                      href={item.href}
                      className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-colors ${
                        item.highlight 
                          ? "text-[#ff00b0] hover:text-[#ff6b6b]" 
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {item.label}
                      {item.submenu && <ChevronDown className="w-4 h-4" />}
                    </Link>

                    {item.submenu && activeDropdown === item.label && (
                      <div className="absolute top-full left-0 pt-2 w-56">
                        <div className="bg-[#1a1a1a] backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                          {item.submenu.map((subitem) => (
                            <Link
                              key={subitem.label}
                              href={subitem.href}
                              className="block px-5 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                            >
                              {subitem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Right Icons */}
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

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a]/98 backdrop-blur-xl border-b border-white/10">
            <nav className="max-w-7xl mx-auto px-4 py-4">
              {menuItems.map((item) => (
                <div key={item.label} className="border-b border-white/5 last:border-0">
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block py-4 text-lg font-semibold uppercase tracking-wider ${
                      item.highlight ? "text-[#ff00b0]" : "text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[104px] md:h-[120px]" />

      {/* Breadcrumbs */}
      <nav className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <ol className="flex items-center gap-2 text-sm text-white/50">
          <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
          <li>/</li>
          <li><Link href="/collections/nails" className="hover:text-white transition-colors">Nails</Link></li>
          <li>/</li>
          <li className="text-white">{product.title}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-[#111] border border-white/10">
              {/* Sale Badge */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <span className="px-3 py-1.5 bg-[#ff00b0] text-black text-xs font-bold uppercase rounded-full">
                  {discount}% OFF
                </span>
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-bold uppercase rounded-full border border-white/20">
                  Bestseller
                </span>
              </div>

              <Image
                src={product.images[activeImage]}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />

              {/* Navigation Arrows */}
              <button 
                onClick={() => setActiveImage(prev => prev === 0 ? product.images.length - 1 : prev - 1)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveImage(prev => prev === product.images.length - 1 ? 0 : prev + 1)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/20"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    activeImage === i 
                      ? "border-[#ff00b0] opacity-100" 
                      : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt={`${product.title} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-[#111] rounded-3xl p-6 md:p-8 border border-white/10">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-[#ff00b0]/10 text-[#ff00b0] text-xs font-bold uppercase rounded-full border border-[#ff00b0]/30">
                Bestseller
              </span>
              <span className="px-3 py-1 bg-white/5 text-white/70 text-xs font-medium rounded-full border border-white/10">
                Semi-Cured Gel
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? "text-[#feca57] fill-[#feca57]" : "text-white/20"}`} 
                  />
                ))}
              </div>
              <span className="text-white font-bold">{product.rating}</span>
              <span className="text-white/50">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-8">
              <span className="text-4xl font-black text-[#ff00b0]">${product.price}</span>
              <span className="text-xl text-white/40 line-through">${product.comparePrice}</span>
              <span className="px-2 py-1 bg-[#ff00b0]/20 text-[#ff00b0] text-sm font-bold rounded">
                Save ${(product.comparePrice - product.price).toFixed(2)}
              </span>
            </div>

            {/* Style Selector */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                Style: <span className="text-[#ff00b0]">{selectedStyle}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {product.styles.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setSelectedStyle(style.name)}
                    className={`group relative w-12 h-12 rounded-full border-2 transition-all ${
                      selectedStyle === style.name 
                        ? "border-[#ff00b0] scale-110" 
                        : "border-white/20 hover:border-white/40"
                    }`}
                    title={style.name}
                  >
                    <span 
                      className="absolute inset-1 rounded-full"
                      style={{ backgroundColor: style.color }}
                    />
                    {selectedStyle === style.name && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-5 h-5 text-[#ff00b0] drop-shadow-lg" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-bold text-white uppercase tracking-wider">
                  Size: <span className="text-[#ff00b0]">{selectedSize}</span>
                </label>
                <button className="text-sm text-[#ff00b0] hover:underline">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-14 h-14 rounded-xl font-bold text-sm transition-all ${
                      selectedSize === size
                        ? "bg-[#ff00b0] text-black"
                        : "bg-white/5 text-white border border-white/10 hover:border-[#ff00b0]/50"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-white uppercase tracking-wider mb-3">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white/5 rounded-xl border border-white/10">
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
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-3 mb-6">
              <button className="flex-1 py-4 px-8 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] text-white font-bold text-lg rounded-full hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg shadow-[#ff00b0]/25">
                Add to Cart - ${(product.price * quantity).toFixed(2)}
              </button>
              <button 
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`w-14 h-14 rounded-full border flex items-center justify-center transition-all ${
                  isWishlisted 
                    ? "bg-[#ff00b0]/20 border-[#ff00b0] text-[#ff00b0]" 
                    : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:border-white/30"
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Buy Now */}
            <button className="w-full py-4 px-8 bg-white text-black font-bold text-lg rounded-full hover:bg-white/90 transition-colors mb-8">
              Buy Now
            </button>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: Truck, text: "Free Shipping $50+" },
                { icon: RefreshCw, text: "14-Day Returns" },
                { icon: Shield, text: "Secure Checkout" },
                { icon: Sparkles, text: "1-5 Day Delivery" }
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                  <badge.icon className="w-4 h-4 text-[#ff00b0]" />
                  <span className="text-xs text-white/70">{badge.text}</span>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-3 pt-6 border-t border-white/10">
              <span className="text-sm text-white/50">Share:</span>
              <div className="flex gap-2">
                {["Facebook", "Twitter", "Pinterest", "Copy"].map((social) => (
                  <button
                    key={social}
                    className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:border-white/30 transition-colors"
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
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="bg-[#111] rounded-3xl border border-white/10 overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-white/10">
            {["description", "how-to-apply", "reviews"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 px-6 text-sm font-bold uppercase tracking-wider transition-colors ${
                  activeTab === tab
                    ? "bg-white/5 text-[#ff00b0] border-b-2 border-[#ff00b0]"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {tab.replace("-", " ")}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === "description" && (
              <div className="space-y-6">
                <p className="text-white/70 leading-relaxed">{product.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {product.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[#ff00b0]/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-[#ff00b0]" />
                      </div>
                      <span className="text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "how-to-apply" && (
              <div className="space-y-8">
                {[
                  { step: 1, title: "Prep Your Nails", desc: "Clean and file your nails. Push back cuticles and buff the nail surface." },
                  { step: 2, title: "Apply the Strips", desc: "Select the right size, peel off the backing, and apply from cuticle to tip." },
                  { step: 3, title: "Cure & Finish", desc: "File off excess and cure under UV/LED lamp for 60 seconds. Done!" }
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff00b0] to-[#7c3aed] flex items-center justify-center text-white font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-white font-bold mb-1">{item.title}</h4>
                      <p className="text-white/60">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-white/10">
                  <div className="text-center">
                    <div className="text-5xl font-black text-white">{product.rating}</div>
                    <div className="flex items-center gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-[#feca57] fill-[#feca57]" />
                      ))}
                    </div>
                    <div className="text-white/50 text-sm mt-1">{product.reviewCount} reviews</div>
                  </div>
                </div>

                {/* Sample Reviews */}
                {[
                  { name: "Sarah M.", rating: 5, date: "2 days ago", text: "Absolutely love these! So easy to apply and they look amazing.", verified: true },
                  { name: "Jessica T.", rating: 5, date: "1 week ago", text: "Best gel nails I've ever tried. Will definitely buy again!", verified: true }
                ].map((review, i) => (
                  <div key={i} className="pb-6 border-b border-white/10 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff00b0] to-[#7c3aed] flex items-center justify-center text-white font-bold">
                          {review.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold">{review.name}</span>
                            {review.verified && (
                              <span className="px-2 py-0.5 bg-[#06b6d4]/20 text-[#06b6d4] text-xs font-bold rounded">Verified</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">
                              {[...Array(review.rating)].map((_, j) => (
                                <Star key={j} className="w-3 h-3 text-[#feca57] fill-[#feca57]" />
                              ))}
                            </div>
                            <span className="text-white/40 text-xs">{review.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-white/70">{review.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-8">
          You May Also <span className="text-[#ff00b0]">Love</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group relative bg-[#111] rounded-2xl overflow-hidden border border-white/10 hover:border-[#ff00b0]/50 transition-all">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src="/crazygels-lifestyle.jpg"
                  alt={`Related product ${i}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button className="absolute top-3 right-3 w-8 h-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white/70 hover:text-[#ff00b0] transition-colors opacity-0 group-hover:opacity-100">
                  <Heart className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4">
                <h3 className="text-white font-bold text-sm mb-1 truncate">Gel Nail Set #{i}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-[#ff00b0] font-bold">$19.99</span>
                  <span className="text-white/40 text-sm line-through">$29.99</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505] mt-16">
        {/* Newsletter */}
        <div className="border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="text-center lg:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                  JOIN THE <span className="text-[#ff00b0]">CRAZY</span> CREW
                </h3>
                <p className="text-white/60">Get exclusive deals, nail tips & early access to new designs</p>
              </div>
              <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-6 py-4 bg-white/5 border border-white/10 rounded-full text-white placeholder:text-white/40 focus:outline-none focus:border-[#ff00b0] transition-colors w-full sm:w-80"
                />
                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] text-white font-bold rounded-full hover:opacity-90 transition-opacity"
                >
                  SUBSCRIBE
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            <div>
              <span className="text-3xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                CRAZY GELS
              </span>
              <p className="text-white/60 text-sm leading-relaxed mt-4 mb-6">
                Premium semi-cured gel nails for the modern woman. Salon-quality results at home.
              </p>
              <div className="flex gap-3">
                {["Instagram", "TikTok", "Facebook"].map((social) => (
                  <button
                    key={social}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#ff00b0] hover:border-[#ff00b0]/50 transition-all"
                  >
                    <Instagram className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {[
              { title: "Shop", links: ["Nails", "Hair", "Skin", "Bundles", "Sale"] },
              { title: "Help", links: ["FAQ", "Shipping", "Returns", "Contact"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Press"] }
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-white font-bold uppercase tracking-wider mb-6">{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <Link href="#" className="text-white/60 hover:text-[#ff00b0] transition-colors text-sm">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6 text-center">
            <p className="text-white/40 text-xs">
              2026 Crazy Gels. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky ATC */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/10 p-4 md:hidden z-40">
        <button className="w-full py-4 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] text-white font-bold text-lg rounded-full">
          Add to Cart - ${(product.price * quantity).toFixed(2)}
        </button>
      </div>
    </main>
  )
}
