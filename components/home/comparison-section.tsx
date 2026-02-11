import { X, Check } from "lucide-react"

const comparisons = [
  {
    old: "Treats symptoms (dry skin, split ends)",
    new: "Treats root causes (cellular hydration, protein synthesis)",
  },
  {
    old: "Static formulas (same bottle for 6 months)",
    new: "Dynamic evolution (adjusts every 28-day cycle)",
  },
  {
    old: 'Generic segments ("for dry skin")',
    new: "N-of-1 personalization (your exact biology)",
  },
  {
    old: "Isolated products (12 brands, no coordination)",
    new: "System protocols (integrated interventions)",
  },
  {
    old: "Hope and marketing",
    new: "Data and outcomes",
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
            {"This Isn't Skincare."}
            <br />
            <span className="text-[var(--bio-teal)]">This Is Biological Optimization.</span>
          </h2>
        </div>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-2 gap-4 mb-4">
          <div className="px-6 py-3">
            <span className="font-mono text-xs font-medium tracking-[0.15em] text-[var(--bio-text-muted)] uppercase">
              Old Beauty
            </span>
          </div>
          <div className="px-6 py-3">
            <span className="font-mono text-xs font-medium tracking-[0.15em] text-[var(--bio-teal)] uppercase">
              Biohacking
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
