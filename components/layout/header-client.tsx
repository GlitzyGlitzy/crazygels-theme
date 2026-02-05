"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ShoppingBag, Search, User, ChevronDown, ArrowRight } from "lucide-react"

// Featured product for mega menu
export interface FeaturedProduct {
  id: string
  title: string
  handle: string
  price: string
  compareAtPrice?: string
  image?: {
    url: string
    altText?: string
  }
}

export interface MenuItem {
  label: string
  href: string
  color?: string
  productCount?: number
  heroImage?: {
    url: string
    altText?: string
  }
  featuredProducts?: FeaturedProduct[]
  submenu?: { label: string; href: string }[]
}

interface HeaderClientProps {
  menuItems: MenuItem[]
}

export function HeaderClient({ menuItems }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/98 backdrop-blur-xl border-b border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#2C2C2C] hover:text-[#D4AF37] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl md:text-3xl font-light tracking-[0.2em] text-[#2C2C2C]">
              CRAZY <span className="font-medium text-[#D4AF37]">GELS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {menuItems.map((item) => {
              const hasMegaMenu = item.featuredProducts && item.featuredProducts.length > 0
              const hasSubmenu = item.submenu && item.submenu.length > 0
              
              return (
                <div 
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => (hasMegaMenu || hasSubmenu) && setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors"
                    style={{ 
                      color: item.color || (item.label === "Sale" ? "#B8860B" : "#2C2C2C")
                    }}
                    onMouseEnter={(e) => {
                      if (!item.color && item.label !== "Sale") {
                        e.currentTarget.style.color = "#D4AF37"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!item.color && item.label !== "Sale") {
                        e.currentTarget.style.color = "#2C2C2C"
                      }
                    }}
                  >
                    {item.label}
                    {item.productCount !== undefined && (
                      <span className="ml-1 text-[10px] text-[#D4AF37] font-normal">({item.productCount})</span>
                    )}
                    {(hasMegaMenu || hasSubmenu) && <ChevronDown className="w-3 h-3" aria-hidden="true" />}
                  </Link>

                  {/* Luxury Mega Menu */}
                  {hasMegaMenu && activeDropdown === item.label && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl shadow-2xl mt-2 overflow-hidden">
                      <div className="grid grid-cols-12 gap-0">
                        {/* Hero Image Section */}
                        {item.heroImage && (
                          <div className="col-span-4 relative h-full min-h-[320px]">
                            <Image
                              src={item.heroImage.url}
                              alt={item.heroImage.altText || item.label}
                              fill
                              className="object-cover"
                              sizes="300px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#2C2C2C]/40" />
                            <div className="absolute bottom-6 left-6 right-6">
                              <h3 className="text-white text-xl font-light tracking-wide mb-2">{item.label}</h3>
                              {item.productCount !== undefined && (
                                <p className="text-white/80 text-sm">{item.productCount} Products</p>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Featured Products Section */}
                        <div className={item.heroImage ? "col-span-8" : "col-span-12"}>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs uppercase tracking-widest text-[#D4AF37] font-medium">Featured Products</h4>
                              <Link 
                                href={item.href}
                                className="text-xs uppercase tracking-wider text-[#2C2C2C]/60 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                              >
                                View All <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-4">
                              {item.featuredProducts?.slice(0, 4).map((product) => (
                                <Link
                                  key={product.id}
                                  href={`/products/${product.handle}`}
                                  className="group"
                                >
                                  <div className="aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] mb-2 border border-[#D4AF37]/10">
                                    {product.image ? (
                                      <Image
                                        src={product.image.url}
                                        alt={product.image.altText || product.title}
                                        width={150}
                                        height={150}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#2C2C2C]/30 text-xs">
                                        No image
                                      </div>
                                    )}
                                  </div>
                                  <h5 className="text-xs text-[#2C2C2C] group-hover:text-[#D4AF37] transition-colors line-clamp-2 font-medium">
                                    {product.title}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-semibold text-[#2C2C2C]">{product.price}</span>
                                    {product.compareAtPrice && (
                                      <span className="text-[10px] text-[#2C2C2C]/50 line-through">{product.compareAtPrice}</span>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                            
                            {/* Subcategory Links */}
                            {hasSubmenu && (
                              <div className="mt-6 pt-4 border-t border-[#D4AF37]/10">
                                <div className="flex flex-wrap gap-3">
                                  {item.submenu?.map((subitem) => (
                                    <Link
                                      key={subitem.label}
                                      href={subitem.href}
                                      className="text-xs text-[#2C2C2C]/70 hover:text-[#D4AF37] transition-colors"
                                    >
                                      {subitem.label}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Simple Dropdown (for items without featured products) */}
                  {!hasMegaMenu && hasSubmenu && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 w-56 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl shadow-2xl py-2 mt-1">
                      {item.submenu?.map((subitem) => (
                        <Link
                          key={subitem.label}
                          href={subitem.href}
                          className="block px-4 py-2 text-sm text-[#2C2C2C]/80 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-colors"
                        >
                          {subitem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="hidden md:flex p-2 text-[#2C2C2C]/70 hover:text-[#D4AF37] transition-colors" aria-label="Search products">
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            <Link href="/account" className="hidden md:flex p-2 text-[#2C2C2C]/70 hover:text-[#D4AF37] transition-colors" aria-label="My account">
              <User className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link href="/cart" className="relative p-2 text-[#2C2C2C]/70 hover:text-[#D4AF37] transition-colors" aria-label="Shopping cart">
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#D4AF37] rounded-full text-[10px] font-bold flex items-center justify-center text-white" aria-hidden="true">
                0
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFEF9] border-t border-[#D4AF37]/20">
          <nav className="px-4 py-4 space-y-2" aria-label="Mobile navigation">
            {menuItems.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  className="block py-3 text-lg font-medium tracking-wide"
                  style={{ 
                    color: item.color || (item.label === "Sale" ? "#B8860B" : "#2C2C2C")
                  }}
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
                        className="block py-2 text-[#2C2C2C]/60 text-sm"
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
  )
}
