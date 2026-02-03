"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, ChevronLeft, ChevronRight, Sparkles, Heart, Shield, Truck, RefreshCw, Instagram, Menu, X, ShoppingBag, Search, User, ChevronDown, Play, ArrowRight } from "lucide-react"

// Colors: #0a0a0a (dark bg), #ff00b0 (pink), #7c3aed (purple), #06b6d4 (cyan), #feca57 (gold)

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [beforeAfterPosition, setBeforeAfterPosition] = useState(50)

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
    { label: "Sale", href: "/collections/sale" }
  ]

  const categories = [
    {
      title: "NAILS",
      subtitle: "Semi-Cured Gel Nail Sets",
      description: "Salon-quality gel nails you can apply at home in minutes. 20+ designs, 14-day wear.",
      image: "/placeholder.svg?height=600&width=500&text=Nail+Collection",
      href: "/collections/nails",
      color: "#ff00b0",
      features: ["14-Day Wear", "UV Cured", "Easy Apply"]
    },
    {
      title: "HAIR",
      subtitle: "Premium Hair Extensions",
      description: "Clip-in, tape-in, and ponytail extensions in 30+ shades. 100% Remy human hair.",
      image: "/placeholder.svg?height=600&width=500&text=Hair+Collection",
      href: "/collections/hair",
      color: "#7c3aed",
      features: ["100% Remy", "30+ Shades", "Heat Safe"]
    },
    {
      title: "SKIN",
      subtitle: "Glow-Up Skincare",
      description: "Clean, effective skincare for your best glow. Serums, masks, and more.",
      image: "/placeholder.svg?height=600&width=500&text=Skin+Collection",
      href: "/collections/skin",
      color: "#06b6d4",
      features: ["Cruelty Free", "Vegan", "Clean Beauty"]
    }
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Los Angeles, CA",
      rating: 5,
      text: "I've tried so many gel nail brands and Crazy Gels is hands down the best! They last 2+ weeks and the application is foolproof. Obsessed!",
      product: "French Kiss Gel Set",
      image: "/placeholder.svg?height=80&width=80&text=S"
    },
    {
      name: "Jessica T.",
      location: "Miami, FL",
      rating: 5,
      text: "The hair extensions are incredible quality. They blend perfectly with my natural hair and I get compliments everywhere I go!",
      product: "Clip-In Extensions",
      image: "/placeholder.svg?height=80&width=80&text=J"
    },
    {
      name: "Emily R.",
      location: "New York, NY",
      rating: 5,
      text: "Finally found skincare that actually works for my sensitive skin. The glow serum is my holy grail product now!",
      product: "Glow Serum",
      image: "/placeholder.svg?height=80&width=80&text=E"
    }
  ]

  const instagramPosts = [
    { image: "/placeholder.svg?height=300&width=300&text=IG1", likes: "2.4k" },
    { image: "/placeholder.svg?height=300&width=300&text=IG2", likes: "1.8k" },
    { image: "/placeholder.svg?height=300&width=300&text=IG3", likes: "3.1k" },
    { image: "/placeholder.svg?height=300&width=300&text=IG4", likes: "2.7k" },
    { image: "/placeholder.svg?height=300&width=300&text=IG5", likes: "1.5k" },
    { image: "/placeholder.svg?height=300&width=300&text=IG6", likes: "2.2k" }
  ]

  const featuredProducts = [
    { name: "French Kiss Gel Set", price: 14.99, comparePrice: 24.99, image: "/placeholder.svg?height=400&width=400&text=Product1", badge: "Bestseller" },
    { name: "Midnight Glam Set", price: 16.99, comparePrice: 26.99, image: "/placeholder.svg?height=400&width=400&text=Product2", badge: "New" },
    { name: "Rose Gold Dreams", price: 15.99, comparePrice: 25.99, image: "/placeholder.svg?height=400&width=400&text=Product3", badge: null },
    { name: "Ocean Vibes Set", price: 14.99, comparePrice: 24.99, image: "/placeholder.svg?height=400&width=400&text=Product4", badge: "Sale" }
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
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white hover:text-[#ff00b0] transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <span className="text-2xl md:text-3xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                CRAZY GELS
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {menuItems.map((item) => (
                <div 
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-colors ${
                      item.label === "Sale" ? "text-[#feca57]" : "text-white/90 hover:text-[#ff00b0]"
                    }`}
                  >
                    {item.label}
                    {item.submenu && <ChevronDown className="w-3 h-3" aria-hidden="true" />}
                  </Link>

                  {item.submenu && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 w-56 bg-[#111111] border border-white/10 rounded-xl shadow-2xl py-2 mt-1">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm text-white/80 hover:text-[#ff00b0] hover:bg-white/5 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-2 md:gap-4">
              <button className="hidden md:flex p-2 text-white/80 hover:text-white transition-colors" aria-label="Search products">
                <Search className="w-5 h-5" aria-hidden="true" />
              </button>
              <Link href="/account" className="hidden md:flex p-2 text-white/80 hover:text-white transition-colors" aria-label="My account">
                <User className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link href="/cart" className="relative p-2 text-white/80 hover:text-white transition-colors" aria-label="Shopping cart with 0 items">
                <ShoppingBag className="w-5 h-5" aria-hidden="true" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff00b0] rounded-full text-[10px] font-bold flex items-center justify-center text-white" aria-hidden="true">
                  0
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-t border-white/10">
            <nav className="px-4 py-4 space-y-2" aria-label="Mobile navigation">
              {menuItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={item.href}
                    className={`block py-3 text-lg font-bold ${
                      item.label === "Sale" ? "text-[#feca57]" : "text-white"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 space-y-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          className="block py-2 text-white/70 text-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 via-[#0a0a0a] to-[#7c3aed]/20" />
          
          {/* Animated Background Elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#ff00b0]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#7c3aed]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

          <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Hero Content */}
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

                {/* Trust Badges */}
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

              {/* Hero Image */}
              <div className="relative">
                <div className="relative aspect-square max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/30 to-[#7c3aed]/30 rounded-3xl blur-2xl" />
                  <Image
                    src="/placeholder.svg?height=600&width=600&text=Hero+Image"
                    alt="Crazy Gels nail collection showcase"
                    fill
                    className="object-cover rounded-3xl relative z-10"
                    priority
                  />
                  {/* Floating Badge */}
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

            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.title}
                  href={category.href}
                  className="group relative overflow-hidden rounded-3xl bg-[#111111] border border-white/10 hover:border-white/20 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="text-sm text-white/60 mb-1">{category.subtitle}</p>
                    <h3 className="text-2xl font-black text-white mb-2" style={{ color: category.color }}>
                      {category.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-4">{category.description}</p>
                    
                    {/* Feature Tags */}
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
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Before/After Section */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#050505]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">SEE THE DIFFERENCE</h2>
              <p className="text-white/70 text-lg">Drag the slider to see the transformation</p>
            </div>

            {/* Before/After Slider */}
            <div className="relative max-w-3xl mx-auto aspect-[4/3] rounded-3xl overflow-hidden">
              {/* Before Image */}
              <div className="absolute inset-0">
                <Image
                  src="/placeholder.svg?height=600&width=800&text=Before"
                  alt="Before applying Crazy Gels"
                  fill
                  className="object-cover"
                />
              </div>

              {/* After Image (clipped) */}
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - beforeAfterPosition}% 0 0)` }}
              >
                <Image
                  src="/placeholder.svg?height=600&width=800&text=After"
                  alt="After applying Crazy Gels"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Slider Control */}
              <div 
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize"
                style={{ left: `${beforeAfterPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <ChevronLeft className="w-4 h-4 text-[#0a0a0a]" aria-hidden="true" />
                  <ChevronRight className="w-4 h-4 text-[#0a0a0a]" aria-hidden="true" />
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={beforeAfterPosition}
                onChange={(e) => setBeforeAfterPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                aria-label="Before and after comparison slider"
              />

              {/* Labels */}
              <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 backdrop-blur-sm rounded-full text-sm font-bold text-white">
                BEFORE
              </div>
              <div className="absolute bottom-4 right-4 px-3 py-1 bg-[#ff00b0]/80 backdrop-blur-sm rounded-full text-sm font-bold text-white">
                AFTER
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white mb-2">BESTSELLERS</h2>
                <p className="text-white/70">Our most-loved products</p>
              </div>
              <Link 
                href="/collections/bestsellers"
                className="hidden md:inline-flex items-center gap-2 text-[#ff00b0] font-bold hover:underline"
              >
                View All <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product, i) => (
                <Link
                  key={i}
                  href={`/products/${product.name.toLowerCase().replace(/ /g, "-")}`}
                  className="group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#111111] border border-white/10 mb-4">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <div className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full ${
                        product.badge === "Sale" ? "bg-[#feca57] text-black" :
                        product.badge === "New" ? "bg-[#06b6d4] text-white" :
                        "bg-[#ff00b0] text-white"
                      }`}>
                        {product.badge}
                      </div>
                    )}
                    <button 
                      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-[#ff00b0] hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                      aria-label={`Add ${product.name} to wishlist`}
                    >
                      <Heart className="w-5 h-5" aria-hidden="true" />
                    </button>
                  </div>
                  <h3 className="text-white font-bold mb-1 group-hover:text-[#ff00b0] transition-colors">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[#ff00b0] font-bold">${product.price}</span>
                    <span className="text-white/50 line-through text-sm">${product.comparePrice}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link 
                href="/collections/bestsellers"
                className="inline-flex items-center gap-2 text-[#ff00b0] font-bold"
              >
                View All Bestsellers <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#050505]">
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

            {/* Testimonial Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-500"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial, i) => (
                    <div key={i} className="w-full flex-shrink-0 px-4">
                      <div className="max-w-2xl mx-auto text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff00b0] to-[#7c3aed] mx-auto mb-6 overflow-hidden">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex justify-center mb-4">
                          {[...Array(testimonial.rating)].map((_, j) => (
                            <Star key={j} className="w-5 h-5 text-[#feca57] fill-[#feca57]" aria-hidden="true" />
                          ))}
                        </div>
                        <blockquote className="text-xl md:text-2xl text-white/90 mb-6 leading-relaxed">
                          &ldquo;{testimonial.text}&rdquo;
                        </blockquote>
                        <p className="text-white font-bold">{testimonial.name}</p>
                        <p className="text-white/60 text-sm">{testimonial.location}</p>
                        <p className="text-[#ff00b0] text-sm mt-1">Purchased: {testimonial.product}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonial(i)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      currentTestimonial === i ? "bg-[#ff00b0]" : "bg-white/20"
                    }`}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Feed */}
        <section className="py-16 md:py-24 px-4 md:px-6">
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
                  className="group relative aspect-square rounded-xl overflow-hidden"
                >
                  <Image
                    src={post.image}
                    alt={`Instagram post ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                  />
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
        <section className="py-16 md:py-24 px-4 md:px-6 bg-[#050505]">
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
        {/* Newsletter */}
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

        {/* Footer Links */}
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

        {/* Bottom Bar */}
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
