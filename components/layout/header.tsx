"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, User, ChevronDown } from "lucide-react"

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
  { label: "Blog", href: "/blog" },
  { 
    label: "Consult", 
    href: "/consult",
    submenu: [
      { label: "Skin Test", href: "/consult/skin" },
      { label: "Hair Test", href: "/consult/hair" }
    ]
  },
  { label: "Sale", href: "/collections/sale" }
]

export function Header() {
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
            {menuItems.map((item) => (
              <div 
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveDropdown(item.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors ${
                    item.label === "Sale" ? "text-[#B8860B]" : "text-[#2C2C2C] hover:text-[#D4AF37]"
                  }`}
                >
                  {item.label}
                  {item.submenu && <ChevronDown className="w-3 h-3" aria-hidden="true" />}
                </Link>

                {item.submenu && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 w-56 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl shadow-2xl py-2 mt-1">
                    {item.submenu.map((subitem) => (
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
            ))}
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
                  className={`block py-3 text-lg font-medium tracking-wide ${
                    item.label === "Sale" ? "text-[#B8860B]" : "text-[#2C2C2C]"
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
