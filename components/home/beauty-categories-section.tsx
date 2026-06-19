import Link from "next/link"
import { ArrowRight, Brush, Droplets, Gem, Hammer, Scissors, Sparkles } from "lucide-react"

const categories = [
  {
    title: "Skincare",
    href: "/collections/skincare",
    description: "Cleansers, serums, moisturizers, masks, SPF, and targeted skin treatments.",
    icon: Droplets,
  },
  {
    title: "Cosmetics",
    href: "/collections/cosmetics",
    description: "Makeup, lip care, complexion products, removers, and everyday beauty essentials.",
    icon: Brush,
  },
  {
    title: "Beauty Tools",
    href: "/collections/treatments?subcategory=beauty-tools",
    description: "Application tools, beauty accessories, UV lamps, nail tools, and treatment kits.",
    icon: Hammer,
  },
  {
    title: "Hair Care",
    href: "/collections/haircare",
    description: "Shampoo, conditioner, masks, oils, scalp care, styling, and hair accessories.",
    icon: Scissors,
  },
  {
    title: "Nail Care",
    href: "/collections/gel-nail-wraps",
    description: "Semi-cured gel nail wraps, French tips, pedicure styles, and nail prep.",
    icon: Gem,
  },
  {
    title: "Beauty Sets",
    href: "/collections/sets",
    description: "Curated kits and bundles for routines, gifts, travel, and at-home salon care.",
    icon: Sparkles,
  },
]

export function BeautyCategoriesSection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-14 md:py-20 lg:py-24">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8 md:mb-12">
          <div>
            <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
              Shop Beauty
            </p>
            <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
              Skincare, cosmetics, tools, and treatments in one place.
            </h2>
          </div>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--bio-teal)] uppercase hover:text-[var(--bio-text)] transition-colors"
          >
            View All Collections
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group border border-[var(--bio-border)] bg-[var(--bio-card)] p-5 md:p-6 transition-all duration-300 hover:border-[var(--bio-teal)]/40 hover:bg-[var(--bio-teal)]/5"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 shrink-0 flex items-center justify-center border border-[var(--bio-teal)]/20 bg-[var(--bio-teal)]/10 text-[var(--bio-teal)]">
                  <category.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-[0.08em] uppercase text-[var(--bio-text)] group-hover:text-[var(--bio-teal)] transition-colors">
                    {category.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--bio-text-muted)]">
                    {category.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
