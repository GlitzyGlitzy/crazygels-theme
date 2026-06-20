import Link from "next/link"
import { ArrowRight, BarChart3, Gift, Mail, PackageCheck, RefreshCw, ShieldCheck, Sparkles } from "lucide-react"

const promisePoints = [
  {
    icon: Sparkles,
    title: "Matched Routines",
    text: "AI recommendations turn browsing into a skin, hair, or nail routine shoppers can buy with confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Fast Confidence",
    text: "Reviews, ingredient logic, secure checkout, returns, and delivery cues stay close to each buying decision.",
  },
  {
    icon: PackageCheck,
    title: "Bundle First",
    text: "Starter, refill, and routine bundles lift average order value without making the catalog feel complicated.",
  },
]

const bundles = [
  {
    name: "Glow Starter",
    route: "/collections/skincare",
    contents: "Cleanser, serum, moisturizer",
    intent: "First routine",
  },
  {
    name: "Nail Reset Kit",
    route: "/collections/gel-nail-wraps",
    contents: "Gel wraps, prep tools, aftercare",
    intent: "Highest repeat need",
  },
  {
    name: "Hair Repair Stack",
    route: "/collections/haircare",
    contents: "Scalp care, mask, finish oil",
    intent: "Problem-solution upsell",
  },
]

const loops = [
  { icon: Mail, label: "Welcome Offer", detail: "Email capture feeds Klaviyo welcome and browse recovery flows." },
  { icon: RefreshCw, label: "Replenishment", detail: "Routine reminders can trigger 21-45 days after first purchase." },
  { icon: Gift, label: "Next-Buy Perks", detail: "Bundle and referral offers create a reason to return." },
  { icon: BarChart3, label: "Measured Funnel", detail: "Consult, bundle, add-to-cart, checkout, and signup events are trackable." },
]

export function LevelOneGrowthSection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-14 md:py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
          <div>
            <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
              Level 1 Growth System
            </p>
            <h2 className="font-serif text-3xl md:text-5xl font-light text-[var(--bio-text)] leading-tight text-balance">
              Buy the right beauty routine, then know exactly what to reorder.
            </h2>
            <p className="mt-5 text-sm md:text-base leading-relaxed text-[var(--bio-text-muted)] max-w-xl">
              Crazy Gels should convert like a guided specialist, not a shelf. The first layer
              is a clear promise, confidence at every step, bundles that make the basket bigger,
              and retention loops that are measurable from day one.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/consult"
                data-growth-event="home_consult_cta"
                className="group inline-flex items-center justify-center gap-3 bg-[var(--bio-teal)] px-7 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-[var(--bio-dark)] transition-all hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
              >
                Build My Routine
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/collections"
                data-growth-event="home_shop_bundles_cta"
                className="inline-flex items-center justify-center border border-[var(--bio-teal)]/30 px-7 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-[var(--bio-teal)] transition-colors hover:bg-[var(--bio-teal)]/10"
              >
                Shop Best Sellers
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              {promisePoints.map((point) => (
                <div key={point.title} className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-5">
                  <point.icon className="h-5 w-5 text-[var(--bio-teal)]" aria-hidden="true" />
                  <h3 className="mt-4 text-sm font-semibold text-[var(--bio-text)]">{point.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--bio-text-muted)]">{point.text}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
              <div className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-5 md:p-6">
                <h3 className="text-sm font-semibold text-[var(--bio-text)]">Bundle Paths</h3>
                <div className="mt-5 space-y-3">
                  {bundles.map((bundle) => (
                    <Link
                      key={bundle.name}
                      href={bundle.route}
                      className="group grid gap-2 border border-[var(--bio-border)] bg-black/20 p-4 transition-colors hover:border-[var(--bio-teal)]/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-[var(--bio-text)]">{bundle.name}</span>
                        <ArrowRight className="h-4 w-4 text-[var(--bio-teal)] transition-transform group-hover:translate-x-1" />
                      </div>
                      <p className="text-xs text-[var(--bio-text-muted)]">{bundle.contents}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--bio-teal)]">
                        {bundle.intent}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-5 md:p-6">
                <h3 className="text-sm font-semibold text-[var(--bio-text)]">Retention Loops</h3>
                <div className="mt-5 space-y-4">
                  {loops.map((loop) => (
                    <div key={loop.label} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--bio-teal)]/25 bg-[var(--bio-teal)]/10">
                        <loop.icon className="h-4 w-4 text-[var(--bio-teal)]" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--bio-text)]">{loop.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--bio-text-muted)]">{loop.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
