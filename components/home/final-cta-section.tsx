import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCtaSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Large ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--bio-teal)]/5 rounded-full blur-[200px]" />

      <div className="relative max-w-[800px] mx-auto px-4 md:px-6 lg:px-12 text-center">
        <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-light text-[var(--bio-text)] mb-6 text-balance">
          Stop Guessing.
          <br />
          <span className="text-[var(--bio-teal)]">Start Glowing.</span>
        </h2>

        <p className="text-base md:text-lg text-[var(--bio-text-muted)] leading-relaxed max-w-xl mx-auto mb-8">
          Get expert product recommendations for your skin, hair, and nails -- personalized
          by AI, backed by real reviews.
        </p>

        <Link
          href="/consult"
          className="group inline-flex items-center gap-3 px-10 py-5 bg-[var(--bio-teal)] text-[var(--bio-dark)] text-sm font-bold tracking-[0.05em] uppercase transition-all duration-300 hover:shadow-[0_0_40px_rgba(0,212,170,0.35)]"
        >
          Get Your Free Consultation
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <p className="mt-5 text-xs text-[var(--bio-text-muted)]">
          No credit card required. Free forever. Your data stays private.
        </p>
      </div>
    </section>
  )
}
