import { Star } from "lucide-react"

const testimonials = [
  {
    quote:
      "I\u2019ve spent \u20AC10,000 on dermatologists. Crazy Gels found the root cause in 30 seconds\u2014copper deficiency showing in my nails, affecting my hair, destroying my skin. Three months later, my Bio-Score went from 48 to 79.",
    author: "Sarah K.",
    location: "Berlin",
    score: "48 \u2192 79",
  },
  {
    quote:
      "As a biohacker, I track everything. Oura, CGM, blood panels. Crazy Gels is the missing piece\u2014external biology finally connected to internal metrics.",
    author: "Marcus T.",
    location: "Amsterdam",
    score: "61 \u2192 88",
  },
  {
    quote:
      "My nails were the canary in the coal mine. Crazy Gels saw it, connected it to my scalp inflammation, fixed my skin as a side effect. This is how beauty should work.",
    author: "Elena R.",
    location: "Paris",
    score: "52 \u2192 83",
  },
]

const stats = [
  { value: "50,000+", label: "Bio-Profiles Created" },
  { value: "94%", label: "Report Visible Improvement" },
  { value: "147", label: "Biological Markers Analyzed" },
  { value: "30s", label: "Average Scan Time" },
]

export function SocialProofSection() {
  return (
    <section className="relative bg-[var(--bio-dark)] py-16 md:py-24 lg:py-32">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            Real Results
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            50,000 Bio-Profiles.{" "}
            <span className="text-[var(--bio-teal)]">94% Report Visible Improvement.</span>
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

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 md:p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-[var(--bio-teal)] text-[var(--bio-teal)]" />
                ))}
              </div>

              <p className="text-sm text-[var(--bio-text)] leading-relaxed mb-6 flex-1">
                {`"${t.quote}"`}
              </p>

              <div className="flex items-end justify-between pt-4 border-t border-[var(--bio-border)]">
                <div>
                  <p className="text-sm font-medium text-[var(--bio-text)]">{t.author}</p>
                  <p className="text-xs text-[var(--bio-text-muted)]">{t.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono tracking-wider text-[var(--bio-text-muted)] uppercase">
                    Bio-Score
                  </p>
                  <p className="font-mono text-sm font-bold text-[var(--bio-teal)]">{t.score}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
