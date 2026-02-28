"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

const features = [
  {
    title: "SKIN ANALYSIS",
    description: "Get matched to the right skincare products based on your skin type, concerns, and goals.",
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
    title: "HAIR ANALYSIS",
    description: "Discover expert-picked hair care tailored to your hair type, damage level, and styling routine.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10" />
        <path d="M20 16.2A7.5 7.5 0 0 0 14.2 8" />
        <path d="M17 21.1A10 10 0 0 0 22 12" />
      </svg>
    ),
  },
  {
    title: "NAIL CARE",
    description: "From gel nails to nail health, find the best products recommended by our community and experts.",
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

export function BioScanSection() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEarlyAccess(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await fetch("/api/klaviyo/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "scan-early-access" }),
      })
      setSubmitted(true)
    } catch {
      // Still show success to not block UX
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            How We Help
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] mb-4 text-balance">
            Expert Product Recommendations
            <br />
            <span className="text-[var(--bio-teal)]">For Skin, Hair, and Nails.</span>
          </h2>
          <p className="text-base text-[var(--bio-text-muted)] max-w-2xl mx-auto">
            Our AI-powered consultant analyzes your unique needs and matches you with the best products
            from our curated catalog. No guesswork, just science-backed recommendations.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-20">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href="/consult"
              className="relative border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 md:p-8 transition-all duration-300 hover:border-[var(--bio-teal)]/30 group"
            >
              <div className="relative">
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[var(--bio-teal)]/10 border border-[var(--bio-teal)]/20 text-[var(--bio-teal)] mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-mono font-semibold text-[var(--bio-teal)] tracking-[0.15em] mb-4">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--bio-text-muted)] leading-relaxed mb-4">
                  {feature.description}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-[var(--bio-teal)] font-medium group-hover:gap-2 transition-all">
                  Start Consultation <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Bio-Scan Coming Soon */}
        <div className="max-w-2xl mx-auto border border-[var(--bio-teal)]/20 bg-[var(--bio-card)] p-6 md:p-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-[var(--bio-teal)] animate-pulse" />
            <h3 className="font-mono text-sm font-semibold text-[var(--bio-teal)] tracking-[0.15em]">
              BIO-SCAN -- COMING SOON
            </h3>
          </div>

          <p className="text-sm text-[var(--bio-text-muted)] mb-6 leading-relaxed">
            We are building a photo-based skin, hair, and nail scanner that uses AI to analyze
            your biological markers and deliver even more precise product recommendations. Sign up
            for early access and be the first to try it.
          </p>

          {submitted ? (
            <div className="py-4 px-6 bg-[var(--bio-teal)]/10 border border-[var(--bio-teal)]/20">
              <p className="text-sm text-[var(--bio-teal)] font-medium">
                You are on the list! We will notify you when the Bio-Scan launches.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEarlyAccess} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-[var(--bio-dark)] border border-[var(--bio-border)] px-4 py-3 text-sm text-[var(--bio-text)] placeholder:text-[var(--bio-text-muted)] focus:outline-none focus:border-[var(--bio-teal)]/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-[var(--bio-teal)] text-[var(--bio-dark)] text-sm font-semibold tracking-[0.05em] uppercase hover:shadow-[0_0_20px_rgba(0,212,170,0.3)] transition-all disabled:opacity-50"
              >
                {loading ? "Signing up..." : "Get Early Access"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
