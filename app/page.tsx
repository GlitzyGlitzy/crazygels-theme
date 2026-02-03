"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, Star, Check, ChevronLeft, ChevronRight, Sparkles, Clock, Heart, Shield, Truck, CreditCard, RefreshCw, Instagram, Menu, X, ShoppingBag, Search, User, ChevronDown } from "lucide-react"

export default function CrazyGelsLanding() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [beforeAfterPosition, setBeforeAfterPosition] = useState(50)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

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
    {
      label: "Bundles",
      href: "/collections/bundles"
    },
    {
      label: "Sale",
      href: "/collections/sale",
      highlight: true
    }
  ]

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Los Angeles, CA",
      text: "I've tried every nail brand out there, but Crazy Gels is the only one that looks salon-perfect and doesn't damage my natural nails. Absolutely obsessed!",
      rating: 5,
      image: "S"
    },
    {
      name: "Jessica T.",
      location: "New York, NY", 
      text: "These nails last SO long! I get compliments everywhere I go. The application is super easy - took me 10 minutes on my first try!",
      rating: 5,
      image: "J"
    },
    {
      name: "Emma R.",
      location: "Miami, FL",
      text: "Finally found my holy grail nail product! No more expensive salon visits. The designs are gorgeous and they ship so fast!",
      rating: 5,
      image: "E"
    },
    {
      name: "Olivia K.",
      location: "Chicago, IL",
      text: "My nails have never looked this good! I'm a nurse and these stay put through all my shifts. Game changer!",
      rating: 5,
      image: "O"
    }
  ]

  const instagramPosts = [
    { id: 1, likes: "2.4K" },
    { id: 2, likes: "1.8K" },
    { id: 3, likes: "3.2K" },
    { id: 4, likes: "2.1K" },
    { id: 5, likes: "1.5K" },
    { id: 6, likes: "2.9K" }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [testimonials.length])

  // Structured Data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Crazy Gels",
    "url": "https://crazygels.com",
    "logo": "https://crazygels.com/logo.png",
    "description": "Premium semi-cured gel nails, hair extensions, and skincare products. Salon-quality beauty at home.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+49-160-9252-7436",
      "contactType": "customer service",
      "email": "info@crazygels.com",
      "availableLanguage": ["English", "German"]
    },
    "sameAs": [
      "https://instagram.com/crazy.gels",
      "https://tiktok.com/@crazygels",
      "https://facebook.com/crazygels"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "50000",
      "bestRating": "5"
    }
  }

  const productListData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Crazy Gels Product Collections",
    "description": "Shop our premium beauty collections including semi-cured gel nails, hair extensions, and skincare",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Semi-Cured Gel Nails",
        "url": "https://crazygels.com/collections/nails",
        "description": "Salon-quality gel nails that last 2+ weeks with zero damage"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Hair Extensions & Care",
        "url": "https://crazygels.com/collections/hair",
        "description": "Premium 100% Remy human hair extensions and professional hair care"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Skincare Collection",
        "url": "https://crazygels.com/collections/skin",
        "description": "Clean, vegan, and cruelty-free skincare products"
      }
    ]
  }

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productListData) }}
      />
      
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
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

                    {/* Dropdown */}
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
                <Link 
                  href="/cart" 
                  className="relative p-2 text-white/70 hover:text-white transition-colors"
                >
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
                  {item.submenu && (
                    <div className="pb-4 pl-4 space-y-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-2 text-sm text-white/60 hover:text-white"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Mobile Search & Account */}
              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-white/10">
                <button className="flex items-center gap-2 text-white/70 hover:text-white">
                  <Search className="w-5 h-5" />
                  <span className="text-sm">Search</span>
                </button>
                <Link href="/account" className="flex items-center gap-2 text-white/70 hover:text-white">
                  <User className="w-5 h-5" />
                  <span className="text-sm">Account</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[104px] md:h-[120px]" />

      {/* Video Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a1f] via-[#0a0a0a] to-[#0f0a12]">
          <div className="absolute inset-0 bg-[url('/crazygels-lifestyle.jpg')] bg-cover bg-center opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        </div>
        
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff00b0]/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7c3aed]/30 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#06b6d4]/20 rounded-full blur-[80px] animate-pulse delay-500" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20 animate-bounce-slow">
            <Sparkles className="w-4 h-4 text-[#ff00b0]" />
            <span className="text-sm font-medium">NEW COLLECTION JUST DROPPED</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-[0.9] tracking-tight">
            <span className="block text-white">NAILS THAT</span>
            <span className="block bg-gradient-to-r from-[#ff00b0] via-[#ff6b6b] to-[#feca57] bg-clip-text text-transparent">SLAY ALL DAY</span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
            Salon-quality gel nails in minutes. No damage. No appointment. Just pure nail magic.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#shop"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(255,0,176,0.5)]"
            >
              <span className="relative z-10">SHOP NOW</span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b6b] to-[#ff00b0] opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button className="inline-flex items-center gap-3 px-6 py-4 text-white/80 hover:text-white transition-colors group">
              <span className="flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-md rounded-full border border-white/20 group-hover:bg-white/20 group-hover:scale-110 transition-all">
                <Play className="w-5 h-5 ml-0.5" fill="currentColor" />
              </span>
              <span className="font-medium">Watch Video</span>
            </button>
          </div>

          {/* Floating Stats */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16">
            {[
              { value: "50K+", label: "Happy Babes" },
              { value: "100+", label: "Designs" },
              { value: "4.9", label: "Rating", icon: Star }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="flex items-center justify-center gap-1 text-3xl md:text-4xl font-black text-white group-hover:text-[#ff00b0] transition-colors">
                  {stat.value}
                  {stat.icon && <stat.icon className="w-6 h-6 fill-[#feca57] text-[#feca57]" />}
                </div>
                <div className="text-white/50 text-sm uppercase tracking-wider mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/50 text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* Marquee Banner */}
      <section className="py-4 bg-gradient-to-r from-[#ff00b0] via-[#ff6b6b] to-[#ff00b0] overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 text-black font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> FREE SHIPPING OVER $50 
              <span className="mx-4">|</span>
              <Heart className="w-4 h-4" /> 2 WEEK WEAR
              <span className="mx-4">|</span>
              <Shield className="w-4 h-4" /> NO DAMAGE FORMULA
            </span>
          ))}
        </div>
      </section>

      {/* Before/After Section */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-[#ff00b0] bg-[#ff00b0]/10 rounded-full">
              The Transformation
            </span>
            <h2 className="text-4xl md:text-6xl font-black">
              BEFORE <span className="text-[#ff00b0]">&</span> AFTER
            </h2>
            <p className="mt-4 text-white/60 max-w-xl mx-auto">
              Slide to see the magic happen. Real results from real customers.
            </p>
          </div>

          {/* Before/After Slider */}
          <div className="relative max-w-2xl mx-auto aspect-square rounded-3xl overflow-hidden border-2 border-white/10 group">
            {/* Before Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-[#3a3a3a] flex items-center justify-center">
                    <span className="text-4xl">💅</span>
                  </div>
                  <span className="text-white/40 text-sm uppercase tracking-wider">Before</span>
                </div>
              </div>
            </div>
            
            {/* After Image (with clip) */}
            <div 
              className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20"
              style={{ clipPath: `inset(0 ${100 - beforeAfterPosition}% 0 0)` }}
            >
              <Image
                src="/crazygels-lifestyle.jpg"
                alt="After transformation"
                fill
                className="object-cover"
              />
              <div className="absolute bottom-6 left-6 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full">
                <span className="text-sm font-bold text-[#ff00b0]">AFTER</span>
              </div>
            </div>

            {/* Slider Handle */}
            <div 
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize"
              style={{ left: `${beforeAfterPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                <ChevronLeft className="w-4 h-4 text-black" />
                <ChevronRight className="w-4 h-4 text-black" />
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
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0f0a12]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-[#06b6d4] bg-[#06b6d4]/10 rounded-full">
              Easy As 1-2-3
            </span>
            <h2 className="text-4xl md:text-6xl font-black">
              HOW IT <span className="bg-gradient-to-r from-[#06b6d4] to-[#7c3aed] bg-clip-text text-transparent">WORKS</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {[
              {
                step: "01",
                title: "PREP",
                description: "Clean your nails and push back cuticles. Use the included prep pad for best results.",
                color: "#ff00b0",
                icon: "✨"
              },
              {
                step: "02", 
                title: "APPLY",
                description: "Peel, stick, and press firmly. Trim excess with the included file. Takes just 10 minutes!",
                color: "#7c3aed",
                icon: "💅"
              },
              {
                step: "03",
                title: "CURE",
                description: "Use any UV/LED lamp or our mini lamp. 60 seconds and you're done. Enjoy for 2+ weeks!",
                color: "#06b6d4",
                icon: "⚡"
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                {/* Connection Line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/4 right-0 w-full h-px bg-gradient-to-r from-white/20 to-transparent translate-x-1/2 z-0" />
                )}
                
                <div className="relative z-10 p-8 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-500 group-hover:-translate-y-2">
                  {/* Step Number */}
                  <div 
                    className="absolute -top-4 -left-4 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="text-6xl mb-6 mt-4">{item.icon}</div>
                  
                  <h3 className="text-2xl font-black mb-3" style={{ color: item.color }}>
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories Section - SEO Optimized */}
      <section id="shop" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-[#7c3aed] bg-[#7c3aed]/10 rounded-full">
              Shop By Category
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-balance">
              EXPLORE OUR <span className="bg-gradient-to-r from-[#ff00b0] via-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent">COLLECTIONS</span>
            </h2>
            <p className="mt-4 text-white/60 max-w-2xl mx-auto text-pretty">
              From stunning semi-cured gel nails to luxurious hair extensions and premium skincare - discover everything you need for your complete beauty routine.
            </p>
          </div>

          {/* Category Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Nails Category */}
            <article className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#ff00b0]/20 to-[#ff00b0]/5 border border-white/10 hover:border-[#ff00b0]/50 transition-all duration-500">
              <div className="aspect-[4/5] relative">
                <Image
                  src="/crazygels-lifestyle.jpg"
                  alt="Semi-Cured Gel Nails Collection - Premium press-on gel nail strips"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#ff00b0] text-black text-xs font-bold uppercase rounded-full">
                    Bestseller
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="text-[#ff00b0] text-sm font-bold uppercase tracking-wider">Premium Collection</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-3">
                    Semi-Cured Gel Nails
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                    Salon-quality gel nails you can apply at home in minutes. Our semi-cured gel nail strips last up to 2 weeks with zero damage to your natural nails. Choose from 100+ stunning designs including French tips, nail art, glitter, and solid colors.
                  </p>
                  
                  {/* Features */}
                  <ul className="flex flex-wrap gap-2 mb-6">
                    {["2 Week Wear", "No Damage", "Easy Apply", "100+ Designs"].map((feature) => (
                      <li key={feature} className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/collections/nails"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff00b0] text-black font-bold rounded-full hover:bg-white transition-colors group/btn"
                  >
                    Shop Nails
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>

            {/* Hair Category */}
            <article className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#7c3aed]/20 to-[#7c3aed]/5 border border-white/10 hover:border-[#7c3aed]/50 transition-all duration-500">
              <div className="aspect-[4/5] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed]/30 to-[#1a1a1a]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ff00b0] flex items-center justify-center text-7xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#7c3aed] text-white text-xs font-bold uppercase rounded-full">
                    New Arrivals
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="text-[#7c3aed] text-sm font-bold uppercase tracking-wider">Luxurious Quality</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-3">
                    Hair Extensions & Care
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                    Transform your look with our premium hair extensions and professional-grade hair care products. From clip-in extensions to nourishing treatments, achieve salon-worthy hair at home.
                  </p>
                  
                  {/* Features */}
                  <ul className="flex flex-wrap gap-2 mb-6">
                    {["100% Remy Hair", "Easy Clip-In", "Heat Safe", "Natural Look"].map((feature) => (
                      <li key={feature} className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/collections/hair"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#7c3aed] text-white font-bold rounded-full hover:bg-white hover:text-[#7c3aed] transition-colors group/btn"
                  >
                    Shop Hair
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>

            {/* Skin Category */}
            <article className="group relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 border border-white/10 hover:border-[#06b6d4]/50 transition-all duration-500">
              <div className="aspect-[4/5] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#06b6d4]/30 to-[#1a1a1a]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#06b6d4] to-[#7c3aed] flex items-center justify-center text-7xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Category Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-[#06b6d4] text-black text-xs font-bold uppercase rounded-full">
                    Self Care
                  </span>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="text-[#06b6d4] text-sm font-bold uppercase tracking-wider">Glow Essentials</span>
                  <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-3">
                    Skincare Collection
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                    Reveal your natural glow with our curated skincare collection. From hydrating face serums to nourishing body care and luscious lip treatments - pamper your skin with premium ingredients.
                  </p>
                  
                  {/* Features */}
                  <ul className="flex flex-wrap gap-2 mb-6">
                    {["Vegan", "Cruelty-Free", "Clean Beauty", "Derma Tested"].map((feature) => (
                      <li key={feature} className="px-2 py-1 bg-white/10 rounded-full text-white/80 text-xs">
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/collections/skin"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#06b6d4] text-black font-bold rounded-full hover:bg-white transition-colors group/btn"
                  >
                    Shop Skincare
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          </div>

          {/* Subcategory Quick Links */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: "French Tips", href: "/collections/french-tips", color: "#ff00b0" },
              { label: "Nail Art", href: "/collections/nail-art", color: "#ff00b0" },
              { label: "Hair Extensions", href: "/collections/hair-extensions", color: "#7c3aed" },
              { label: "Face Serums", href: "/collections/face-care", color: "#06b6d4" },
              { label: "Bundles", href: "/collections/bundles", color: "#feca57" },
              { label: "Sale", href: "/collections/sale", color: "#ff6b6b" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-center"
              >
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: link.color }}
                />
                <span className="text-white/80 text-sm font-medium group-hover:text-white transition-colors">
                  {link.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-20 bg-gradient-to-b from-[#0a0a0a] to-[#0f0a12]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="prose prose-invert prose-lg max-w-none">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6 text-center">
              Why Choose Crazy Gels for Your Beauty Routine?
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-[#ff00b0] mb-3">Premium Semi-Cured Gel Nails</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Our semi-cured gel nail strips are made with real gel formula that cures under UV/LED light for a chip-free, salon-quality manicure that lasts up to 2 weeks. Unlike traditional press-on nails, our gel strips flex and move naturally with your nails, providing a seamless look and feel.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-[#7c3aed] mb-3">Luxurious Hair Extensions</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Transform your hair in seconds with our 100% Remy human hair extensions. From voluminous clip-ins to seamless tape-ins, our extensions blend naturally with your hair for added length, volume, and versatility. Heat-safe up to 180C for styling freedom.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-[#06b6d4] mb-3">Clean Skincare Products</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Our skincare collection features clean, vegan, and cruelty-free formulas that deliver real results. From hydrating serums to gentle cleansers, each product is dermatologist-tested and free from harsh chemicals, parabens, and sulfates.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-[#feca57] mb-3">Trusted by 50,000+ Customers</h3>
                <p className="text-white/70 text-sm leading-relaxed">
                  Join our community of beauty lovers who have discovered the Crazy Gels difference. With a 4.9-star rating and thousands of 5-star reviews, we're proud to be the go-to destination for DIY beauty that delivers professional results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-16 bg-[#0f0a12] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Truck, title: "Free Shipping", subtitle: "Orders over $50" },
              { icon: RefreshCw, title: "Easy Returns", subtitle: "30-day guarantee" },
              { icon: Shield, title: "Secure Payment", subtitle: "SSL encrypted" },
              { icon: CreditCard, title: "Buy Now, Pay Later", subtitle: "Afterpay & Klarna" }
            ].map((badge, index) => (
              <div key={index} className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center group-hover:from-[#ff00b0]/20 group-hover:to-[#7c3aed]/20 transition-all duration-300">
                  <badge.icon className="w-7 h-7 text-white/80 group-hover:text-[#ff00b0] transition-colors" />
                </div>
                <h4 className="font-bold text-white">{badge.title}</h4>
                <p className="text-sm text-white/50">{badge.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="py-24 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-[#feca57] bg-[#feca57]/10 rounded-full">
              The Reviews Are In
            </span>
            <h2 className="text-4xl md:text-6xl font-black">
              LOVED BY <span className="text-[#feca57]">50K+</span> BABES
            </h2>
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-3xl mx-auto">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/10">
                      {/* Stars */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-[#feca57] text-[#feca57]" />
                        ))}
                      </div>
                      
                      <blockquote className="text-xl md:text-2xl text-white font-medium leading-relaxed mb-8">
                        "{testimonial.text}"
                      </blockquote>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff00b0] to-[#7c3aed] flex items-center justify-center text-xl font-bold">
                          {testimonial.image}
                        </div>
                        <div>
                          <div className="font-bold text-white">{testimonial.name}</div>
                          <div className="text-white/50 text-sm">{testimonial.location}</div>
                        </div>
                        <div className="ml-auto">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            <Check className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index 
                      ? "bg-[#ff00b0] w-8" 
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            {/* Arrows */}
            <button 
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Instagram Feed Section */}
      <section className="py-24 bg-gradient-to-b from-[#0a0a0a] to-[#0f0a12]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1 mb-4 text-xs font-bold uppercase tracking-widest text-[#ff00b0] bg-[#ff00b0]/10 rounded-full">
              <Instagram className="w-4 h-4" /> @crazy.gels
            </span>
            <h2 className="text-4xl md:text-6xl font-black">
              JOIN THE <span className="bg-gradient-to-r from-[#ff00b0] via-[#7c3aed] to-[#06b6d4] bg-clip-text text-transparent">COMMUNITY</span>
            </h2>
            <p className="mt-4 text-white/60">Tag us in your nail pics for a chance to be featured!</p>
          </div>

          {/* Instagram Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {instagramPosts.map((post, index) => (
              <Link 
                key={post.id} 
                href="https://instagram.com/crazy.gels"
                target="_blank"
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20"
              >
                <Image
                  src="/crazygels-lifestyle.jpg"
                  alt={`Instagram post ${index + 1}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex items-center gap-2 text-white">
                    <Heart className="w-5 h-5 fill-white" />
                    <span className="font-bold">{post.likes}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="https://instagram.com/crazy.gels"
              target="_blank"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
            >
              <Instagram className="w-5 h-5" />
              <span className="font-medium">Follow @crazy.gels</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff00b0] via-[#7c3aed] to-[#06b6d4]" />
        <div className="absolute inset-0 bg-[url('/crazygels-lifestyle.jpg')] bg-cover bg-center mix-blend-overlay opacity-30" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
            READY TO SLAY?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Get 15% off your first order with code <span className="font-bold text-white">SLAY15</span>
          </p>
          <Link
            href="#shop"
            className="inline-flex items-center justify-center px-10 py-5 text-lg font-black text-[#ff00b0] bg-white rounded-full hover:scale-105 transition-transform shadow-2xl"
          >
            SHOP NOW
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#050505]">
        {/* Newsletter Section */}
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

        {/* Main Footer Content */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link href="/" className="inline-block mb-6">
                <span className="text-3xl font-black bg-gradient-to-r from-[#ff00b0] to-[#ff6b6b] bg-clip-text text-transparent">
                  CRAZY GELS
                </span>
              </Link>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Premium semi-cured gel nails for the modern woman. Salon-quality results at home, with zero damage.
              </p>
              {/* Social Links */}
              <div className="flex gap-3">
                {[
                  { name: "Instagram", href: "https://instagram.com/crazy.gels", icon: <Instagram className="w-5 h-5" /> },
                  { name: "TikTok", href: "https://tiktok.com/@crazygels", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg> },
                  { name: "Facebook", href: "https://facebook.com/crazygels", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
                  { name: "Pinterest", href: "https://pinterest.com/crazygels", icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg> }
                ].map((social) => (
                  <Link
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-[#ff00b0] hover:border-[#ff00b0]/50 hover:bg-[#ff00b0]/10 transition-all"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Shop Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Shop</h4>
              <ul className="space-y-3">
                {[
                  { label: "Nails", href: "/collections/nails" },
                  { label: "Hair", href: "/collections/hair" },
                  { label: "Skin", href: "/collections/skin" },
                  { label: "Bundles", href: "/collections/bundles" },
                  { label: "Sale", href: "/collections/sale" },
                  { label: "New Arrivals", href: "/collections/new" }
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/60 hover:text-[#ff00b0] transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Help</h4>
              <ul className="space-y-3">
                {[
                  { label: "FAQ", href: "/pages/faq" },
                  { label: "Shipping & Returns", href: "/pages/shipping-returns" },
                  { label: "Track Order", href: "/pages/track-order" },
                  { label: "How To Apply", href: "/pages/how-to-apply" },
                  { label: "Contact Us", href: "/pages/contact" },
                  { label: "Size Guide", href: "/pages/size-guide" }
                ].map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-white/60 hover:text-[#ff00b0] transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Column */}
            <div>
              <h4 className="text-white font-bold uppercase tracking-wider mb-6">Contact Us</h4>
              <ul className="space-y-4">
                <li>
                  <a href="mailto:info@crazygels.com" className="flex items-center gap-3 text-white/60 hover:text-[#ff00b0] transition-colors text-sm group">
                    <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#ff00b0]/50 group-hover:bg-[#ff00b0]/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </span>
                    info@crazygels.com
                  </a>
                </li>
                <li>
                  <a href="tel:+4916092527436" className="flex items-center gap-3 text-white/60 hover:text-[#ff00b0] transition-colors text-sm group">
                    <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#ff00b0]/50 group-hover:bg-[#ff00b0]/10 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    </span>
                    +49 160 9252 7436
                  </a>
                </li>
              </ul>
              
              {/* Business Hours */}
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Support Hours</p>
                <p className="text-white/70 text-sm">Mon - Fri: 9am - 6pm CET</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-white/40 text-sm">Secure payments with</p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {["Visa", "Mastercard", "Amex", "PayPal", "Apple Pay", "Google Pay", "Shop Pay", "Klarna", "Afterpay"].map((method) => (
                  <div
                    key={method}
                    className="px-3 py-2 bg-white/5 rounded-lg border border-white/10 text-white/60 text-xs font-medium"
                  >
                    {method}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
              <p className="text-white/40 text-xs">
                © 2026 Crazy Gels. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                {[
                  { label: "Privacy Policy", href: "/pages/privacy" },
                  { label: "Terms of Service", href: "/pages/terms" },
                  { label: "Refund Policy", href: "/pages/refunds" },
                  { label: "Imprint", href: "/pages/imprint" }
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-white/40 hover:text-white/70 text-xs transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
    </>
  )
}
