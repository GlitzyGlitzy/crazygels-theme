import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

const plans = [
  {
    name: "BIO-ANALYSIS",
    price: "FREE",
    period: "",
    highlight: false,
    features: [
      "Complete skin, hair, nail scan",
      "Bio-Score and root cause analysis",
      "Product recommendations (CG + curated)",
      "Progress tracking",
      "Community access",
    ],
  },
  {
    name: "BIO-CUSTOM",
    price: "\u20AC59",
    period: "/month",
    highlight: true,
    features: [
      "Everything in Free, plus:",
      "Custom formulations (3 products)",
      "Real-time environmental adaptation",
      "Priority support",
    ],
  },
  {
    name: "BIO-EVOLUTION",
    price: "\u20AC99",
    period: "/month",
    highlight: false,
    features: [
      "Everything in Custom, plus:",
      "Monthly formula evolution",
      "Nutraceutical stack",
      "1:1 biohacking consultant",
      "Quarterly biological aging assessment",
    ],
  },
]

export function PricingSection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-16 md:py-24 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />

      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            Pricing
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            Start Free.{" "}
            <span className="text-[var(--bio-teal)]">Upgrade When You&apos;re Ready.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative border p-6 md:p-8 flex flex-col ${
                plan.highlight
                  ? "border-[var(--bio-teal)]/40 bg-[var(--bio-teal)]/5"
                  : "border-[var(--bio-border)] bg-[var(--bio-card)]"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-6 px-3 py-1 bg-[var(--bio-teal)] text-[var(--bio-dark)] text-[10px] font-mono font-bold tracking-[0.15em] uppercase">
                  Most Popular
                </div>
              )}

              <h3 className="font-mono text-xs font-semibold tracking-[0.2em] text-[var(--bio-teal)] mb-4">
                {plan.name}
              </h3>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl md:text-5xl font-light text-[var(--bio-text)]">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-[var(--bio-text-muted)]">{plan.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[var(--bio-teal)] mt-0.5 shrink-0" />
                    <span className="text-sm text-[var(--bio-text-muted)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/consult"
                className={`group inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold tracking-[0.05em] uppercase transition-all duration-300 ${
                  plan.highlight
                    ? "bg-[var(--bio-teal)] text-[var(--bio-dark)] hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
                    : "border border-[var(--bio-teal)]/30 text-[var(--bio-teal)] hover:bg-[var(--bio-teal)]/10"
                }`}
              >
                {plan.price === "FREE" ? "Get Started Free" : "Choose Plan"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
