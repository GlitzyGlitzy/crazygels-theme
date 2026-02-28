import { Sparkles, ShieldCheck, Users, Zap } from "lucide-react"

const reasons = [
  {
    icon: Sparkles,
    title: "Personalized",
    description: "Every recommendation is tailored to your unique skin type, hair texture, and nail concerns.",
  },
  {
    icon: ShieldCheck,
    title: "Expert-Backed",
    description: "Our product catalog is curated using dermatologist-approved guidelines and real ingredient science.",
  },
  {
    icon: Users,
    title: "Community Reviews",
    description: "See real feedback from customers with similar concerns before you buy.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Get your personalized routine in under 2 minutes. No appointments, no waiting.",
  },
]

const stats = [
  { value: "500+", label: "Curated Products" },
  { value: "Free", label: "AI Consultation" },
  { value: "24/7", label: "Always Available" },
  { value: "2 min", label: "To Your Routine" },
]

export function SocialProofSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            Why Customers Choose Us
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            Smart Beauty Shopping.{" "}
            <span className="text-[var(--bio-teal)]">Powered by AI.</span>
          </h2>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 md:mb-16">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center py-5 px-4 border border-[var(--bio-border)] bg-[var(--bio-card)]"
            >
              <p className="font-mono text-2xl md:text-3xl font-bold text-[var(--bio-teal)]">
                {stat.value}
              </p>
              <p className="text-xs text-[var(--bio-text-muted)] mt-1 tracking-wide">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Reasons grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 md:p-8"
            >
              <r.icon className="w-6 h-6 text-[var(--bio-teal)] mb-4" />
              <h3 className="text-sm font-semibold text-[var(--bio-text)] mb-2">{r.title}</h3>
              <p className="text-xs text-[var(--bio-text-muted)] leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
