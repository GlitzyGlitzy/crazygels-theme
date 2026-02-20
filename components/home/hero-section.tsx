import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] overflow-hidden">
      {/* Ambient glow -- hidden on mobile for GPU performance */}
      <div className="hidden md:block absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--bio-teal)]/5 rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3" />
      <div className="hidden md:block absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--bio-teal)]/3 rounded-full blur-[120px] -translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12 py-12 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[var(--bio-teal)]/20 rounded-full mb-6">
              <span className="w-2 h-2 rounded-full bg-[var(--bio-teal)] animate-pulse" />
              <span className="text-[11px] font-medium tracking-[0.2em] text-[var(--bio-teal)] uppercase">
                Biological Intelligence
              </span>
            </div>

            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-light leading-[1.05] tracking-tight text-[var(--bio-text)] mb-5 md:mb-6 text-balance">
              Your Body <span className="text-[var(--bio-teal)]">Speaks.</span>
              <br />
              We Listen.
              <br />
              You <span className="italic">Optimize.</span>
            </h1>

            <p className="text-base md:text-lg text-[var(--bio-text-muted)] leading-relaxed max-w-lg mb-8">
              The first biohacking platform that treats your skin, hair, and nails as one
              interconnected system. AI-powered analysis. Precision formulations. Biological optimization.
            </p>

            <Link
              href="/consult"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[var(--bio-teal)] text-[var(--bio-dark)] text-sm font-semibold tracking-[0.05em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
            >
              Start Your Free Bio-Analysis
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <p className="mt-4 text-xs text-[var(--bio-text-muted)]">
              No credit card required. 30-second scan. GDPR compliant.
            </p>
          </div>

          {/* Right visual - Bio scan preview (hidden on small mobile to keep CTA visible) */}
          <div className="hidden md:block relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border border-[var(--bio-teal)]/10" />
              <div className="absolute inset-4 rounded-full border border-[var(--bio-teal)]/15" />
              <div className="absolute inset-8 rounded-full border border-[var(--bio-teal)]/20" />

              {/* Pulsing ring */}
              <div className="absolute inset-12 rounded-full border-2 border-[var(--bio-teal)]/30 animate-pulse-ring" />

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-[var(--bio-teal)]/40 flex items-center justify-center bg-[var(--bio-teal)]/5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[var(--bio-teal)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" />
                      <path d="M2 17l10 5 10-5" />
                      <path d="M2 12l10 5 10-5" />
                    </svg>
                  </div>
                  <p className="text-[var(--bio-teal)] font-mono text-sm font-medium">BIO-SCORE</p>
                  <p className="text-[var(--bio-text)] font-mono text-3xl font-bold mt-1">72/100</p>
                </div>
              </div>

              {/* Floating data points */}
              <div className="absolute top-8 right-4 px-3 py-2 bg-[var(--bio-card)] border border-[var(--bio-border)] text-xs font-mono">
                <span className="text-[var(--bio-teal)]">SKIN</span>
                <span className="text-[var(--bio-text-muted)] ml-2">analyzing...</span>
              </div>
              <div className="absolute bottom-16 left-0 px-3 py-2 bg-[var(--bio-card)] border border-[var(--bio-border)] text-xs font-mono">
                <span className="text-[var(--bio-teal)]">HAIR</span>
                <span className="text-[var(--bio-text-muted)] ml-2">147 markers</span>
              </div>
              <div className="absolute bottom-4 right-8 px-3 py-2 bg-[var(--bio-card)] border border-[var(--bio-border)] text-xs font-mono">
                <span className="text-[var(--bio-teal)]">NAILS</span>
                <span className="text-[var(--bio-text-muted)] ml-2">connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
