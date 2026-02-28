import { X, Check } from "lucide-react"

const comparisons = [
  {
    old: "Random product hauls from social media",
    new: "AI-matched products based on your needs",
  },
  {
    old: "One-size-fits-all recommendations",
    new: "Personalized routine for your skin, hair, and nails",
  },
  {
    old: 'Guessing what works ("this influencer uses it")',
    new: "Expert-backed suggestions with real reviews",
  },
  {
    old: "Buying 12 products and using 3",
    new: "A curated set that actually works together",
  },
  {
    old: "Overpaying for hype and packaging",
    new: "Best value products selected for quality",
  },
]

export function ComparisonSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="max-w-[1000px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            The Difference
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] mb-4 text-balance">
            {"Shopping Without a Plan?"}
            <br />
            <span className="text-[var(--bio-teal)]">Let Us Be Your Guide.</span>
          </h2>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-2 gap-4 mb-4">
          <div className="px-6 py-3">
            <span className="font-mono text-xs font-medium tracking-[0.15em] text-[var(--bio-text-muted)] uppercase">
              Without Us
            </span>
          </div>
          <div className="px-6 py-3">
            <span className="font-mono text-xs font-medium tracking-[0.15em] text-[var(--bio-teal)] uppercase">
              With Crazy Gels
            </span>
          </div>
        </div>

        {/* Comparison rows */}
        <div className="space-y-3">
          {comparisons.map((row, i) => (
            <div key={i} className="grid md:grid-cols-2 gap-3 md:gap-4">
              {/* Old */}
              <div className="flex items-start gap-3 px-5 py-4 bg-[var(--bio-card)] border border-[var(--bio-border)]">
                <X className="w-4 h-4 text-[#FF6B6B] mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--bio-text-muted)]">{row.old}</span>
              </div>
              {/* New */}
              <div className="flex items-start gap-3 px-5 py-4 bg-[var(--bio-teal)]/5 border border-[var(--bio-teal)]/20">
                <Check className="w-4 h-4 text-[var(--bio-teal)] mt-0.5 shrink-0" />
                <span className="text-sm text-[var(--bio-text)]">{row.new}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
