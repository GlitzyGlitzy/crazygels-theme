const scans = [
  {
    title: "SKIN SCAN",
    analysis: "Facial analysis: hydration, barrier function, inflammation, aging markers, microbiome health",
    reveals: "Cellular turnover, environmental damage, immune response",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
  },
  {
    title: "HAIR SCAN",
    analysis: "Scalp analysis: follicle density, growth phase, sebum production, porosity",
    reveals: "Hormonal status, nutritional gaps, stress load",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" />
        <path d="M20 16.2A7.5 7.5 0 0 0 14.2 8" />
        <path d="M17 21.1A10 10 0 0 0 22 12" />
      </svg>
    ),
  },
  {
    title: "NAIL SCAN",
    analysis: "Nail analysis: keratin quality, growth rate, discoloration, ridge patterns",
    reveals: "Protein synthesis, mineral status, systemic health",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
        <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2" />
        <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8" />
        <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
      </svg>
    ),
  },
]

const bioScores = [
  { label: "Structural Integrity", score: 72, desc: "Collagen, keratin, elastin synthesis" },
  { label: "Barrier Defense", score: 58, desc: "Lipid layer, microbiome, immune response" },
  { label: "Cellular Energy", score: 81, desc: "Mitochondrial function, nutrient status" },
  { label: "Hormonal Balance", score: 64, desc: "Cortisol, androgens, thyroid markers" },
  { label: "Oxidative Stress", score: 45, desc: "Inflammation, free radical load, aging speed" },
]

function getScoreColor(score: number) {
  if (score >= 75) return "bg-[#00D4AA]"
  if (score >= 60) return "bg-[#FFB347]"
  return "bg-[#FF6B6B]"
}

export function BioScanSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            The Solution
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] mb-4 text-balance">
            One Scan. Three Biomarkers.
            <br />
            <span className="text-[var(--bio-teal)]">Your Complete Biological Profile.</span>
          </h2>
        </div>

        {/* Three scan cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-20">
          {scans.map((scan) => (
            <div
              key={scan.title}
              className="relative border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 md:p-8 transition-all duration-300 hover:border-[var(--bio-teal)]/30 group"
            >
              {/* Scan line effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute left-0 right-0 h-px bg-[var(--bio-teal)]/20 animate-scan" />
              </div>

              <div className="relative">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bio-teal)]/10 border border-[var(--bio-teal)]/20 text-[var(--bio-teal)] mb-5">
                  {scan.icon}
                </div>
                <h3 className="text-sm font-mono font-semibold text-[var(--bio-teal)] tracking-[0.15em] mb-4">
                  {scan.title}
                </h3>
                <p className="text-sm text-[var(--bio-text-muted)] leading-relaxed mb-4">
                  {scan.analysis}
                </p>
                <div className="pt-4 border-t border-[var(--bio-border)]">
                  <p className="text-[10px] font-mono tracking-[0.15em] text-[var(--bio-text-muted)] uppercase mb-1">
                    What it reveals
                  </p>
                  <p className="text-sm text-[var(--bio-text)]">{scan.reveals}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bio-Score output */}
        <div className="max-w-2xl mx-auto border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 md:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-3 h-3 rounded-full bg-[var(--bio-teal)] animate-pulse" />
            <h3 className="font-mono text-sm font-semibold text-[var(--bio-teal)] tracking-[0.15em]">
              YOUR BIO-SCORE
            </h3>
          </div>

          <div className="space-y-5">
            {bioScores.map((item) => (
              <div key={item.label}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm text-[var(--bio-text)]">{item.label}</span>
                  <span className="font-mono text-sm font-semibold text-[var(--bio-text)]">
                    {item.score}/100
                  </span>
                </div>
                <div className="h-2 bg-[var(--bio-border)] overflow-hidden">
                  <div
                    className={`h-full ${getScoreColor(item.score)} animate-bar`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
                <p className="text-[10px] font-mono text-[var(--bio-text-muted)] mt-1 tracking-wide">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--bio-border)]">
            <p className="font-mono text-xs text-[var(--bio-teal)] tracking-wider uppercase mb-1">
              Priority: Oxidative Stress + Barrier Defense
            </p>
            <p className="text-xs text-[var(--bio-text-muted)]">
              Root Cause: Environmental pollution, insufficient antioxidants, sleep architecture
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
