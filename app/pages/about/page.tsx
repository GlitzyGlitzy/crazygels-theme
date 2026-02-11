import type { Metadata } from "next"
import Link from "next/link"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "About Crazy Gels | Biohacking Beauty",
  description:
    "Crazy Gels is the first biohacking beauty platform that treats your skin, hair, and nails as one interconnected biological system. Learn about our mission and approach.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Our Story
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4 text-balance">
            Beauty Is Biology. <span className="text-[#00D4AA]">We Optimize It.</span>
          </h1>
        </div>

        <div className="space-y-8 text-sm md:text-base text-[#999] leading-relaxed">
          <p>
            Crazy Gels started with a simple observation:{" "}
            <span className="text-[#E8E8E8]">
              the beauty industry treats your body like a collection of unrelated parts.
            </span>{" "}
            One brand for your skin. Another for your hair. A third for your nails. None of them
            talking to each other. None of them seeing the full picture.
          </p>

          <p>
            We knew there had to be a better way. Your skin, hair, and nails share the same building
            blocks -- collagen, keratin, micronutrients, hormones. When one suffers, the others
            follow.{" "}
            <span className="text-[#00D4AA]">
              Brittle nails, thinning hair, and dull skin are not three separate problems. They are
              one biological signal.
            </span>
          </p>

          <p>
            That insight became Crazy Gels: a platform built on the principle that beauty is biology,
            and biology demands a systems approach. We use AI-powered analysis to understand your
            unique biological profile, then curate products and protocols that work as one
            interconnected system.
          </p>

          <div className="border border-[#1A1A1A] bg-[#111] p-6 md:p-8">
            <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-[#00D4AA] uppercase mb-4">
              What We Believe
            </h2>
            <ul className="space-y-3">
              {[
                "Your body is one system, not a collection of parts",
                "Data beats guesswork -- always",
                "Personalization means N-of-1, not segments",
                "Transparency is non-negotiable (ingredients, sourcing, outcomes)",
                "Beauty should be empowering, not confusing",
              ].map((belief) => (
                <li key={belief} className="flex items-start gap-2.5 text-sm text-[#E8E8E8]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00D4AA] mt-1.5 shrink-0" />
                  {belief}
                </li>
              ))}
            </ul>
          </div>

          <p>
            Based in the EU, we are committed to GDPR compliance, cruelty-free products, and full
            ingredient transparency. Your biological data is encrypted, anonymized, and never sold.
          </p>

          <p>
            Whether you are a biohacker tracking every metric or someone who is just tired of buying
            products that do not work, Crazy Gels is built for you.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 pt-8 border-t border-[#1A1A1A] text-center">
          <Link
            href="/consult"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-[#00D4AA] text-[#0A0A0A] text-sm font-semibold tracking-[0.05em] uppercase transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
          >
            Start Your Free Bio-Analysis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
