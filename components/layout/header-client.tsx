"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Menu, X, ShoppingBag, Search, User, ChevronDown } from "lucide-react"

export interface MenuItem {
  label: string
  href: string
  color?: string
  submenu?: { label: string; href: string }[]
}

interface HeaderClientProps {
  menuItems: MenuItem[]
}

export function HeaderClient({ menuItems }: HeaderClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileExpandedItem(null)
  }, [])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  const handleMouseEnter = (label: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setActiveDropdown(label)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <header className="sticky top-0 z-50 bg-[#FAF7F2]/98 backdrop-blur-xl border-b border-[#B76E79]/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#2C2C2C] hover:text-[#B76E79] transition-colors"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl md:text-3xl font-light tracking-[0.2em] text-[#2C2C2C]">
              CRAZY <span className="font-medium text-[#B76E79]">GELS</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => item.submenu && handleMouseEnter(item.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-4 py-2 text-sm font-medium uppercase tracking-widest transition-colors text-[#2C2C2C] hover:text-[#B76E79]"
                  style={item.color ? { color: item.color } : undefined}
                >
                  {item.label}
                  {item.submenu && <ChevronDown className="w-3 h-3" aria-hidden="true" />}
                </Link>

                {item.submenu && activeDropdown === item.label && (
                  <div className="absolute top-full left-0 w-56 bg-[#FFFEF9] border border-[#B76E79]/20 rounded-xl shadow-2xl py-2 mt-1 z-50">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className="block px-4 py-2.5 text-sm text-[#2C2C2C]/80 hover:text-[#B76E79] hover:bg-[#B76E79]/5 transition-colors"
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
            <button className="hidden md:flex p-2 text-[#2C2C2C]/70 hover:text-[#B76E79] transition-colors" aria-label="Search products">
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            <Link href="/account" className="hidden md:flex p-2 text-[#2C2C2C]/70 hover:text-[#B76E79] transition-colors" aria-label="My account">
              <User className="w-5 h-5" aria-hidden="true" />
            </Link>
            <Link href="/cart" className="relative p-2 text-[#2C2C2C]/70 hover:text-[#B76E79] transition-colors" aria-label="Shopping cart">
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFEF9] border-t border-[#B76E79]/20 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="px-4 py-4 space-y-1" aria-label="Mobile navigation">
            {menuItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between">
                  <Link
                    href={item.href}
                    className="flex-1 block py-3 text-lg font-medium tracking-wide text-[#2C2C2C]"
                    style={item.color ? { color: item.color } : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.submenu && (
                    <button
                      onClick={() => setMobileExpandedItem(mobileExpandedItem === item.label ? null : item.label)}
                      className="p-2 text-[#2C2C2C]/60"
                      aria-label={`Expand ${item.label} submenu`}
                      aria-expanded={mobileExpandedItem === item.label}
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileExpandedItem === item.label ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                  )}
                </div>
                {item.submenu && mobileExpandedItem === item.label && (
                  <div className="pl-4 pb-2 space-y-1">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
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
