import { Eye, Cloud, Factory, Lock } from "lucide-react"

const techStack = [
  {
    icon: Eye,
    title: "GPT-4V Multimodal AI",
    description: "Analyzes visual biomarkers invisible to the human eye across skin, scalp, and nail surfaces.",
  },
  {
    icon: Cloud,
    title: "Environmental APIs",
    description: "Real-time UV, pollution, humidity, and water hardness integration for adaptive formulations.",
  },
  {
    icon: Factory,
    title: "Micro-Batch Manufacturing",
    description: "100-unit minimum, 24-hour turnaround. True personalization, not mass-produced segments.",
  },
  {
    icon: Lock,
    title: "Blockchain Traceability",
    description: "Every ingredient, every batch, every outcome logged. Full transparency from lab to skin.",
  },
]

export function TechnologySection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-16 md:py-24 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            The Technology
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            Computer Vision. Biological Intelligence.
            <br />
            <span className="text-[var(--bio-teal)]">Precision Manufacturing.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {techStack.map((tech) => (
            <div
              key={tech.title}
              className="border border-[var(--bio-border)] bg-[var(--bio-card)] p-6 transition-all duration-300 hover:border-[var(--bio-teal)]/20"
            >
              <tech.icon className="w-6 h-6 text-[var(--bio-teal)] mb-4" />
              <h3 className="text-sm font-semibold text-[var(--bio-text)] mb-2">{tech.title}</h3>
              <p className="text-xs text-[var(--bio-text-muted)] leading-relaxed">{tech.description}</p>
            </div>
          ))}
        </div>

        {/* Security banner */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-6 px-6 border border-[var(--bio-teal)]/10 bg-[var(--bio-teal)]/5 text-center md:text-left">
          <Lock className="w-5 h-5 text-[var(--bio-teal)] shrink-0" />
          <p className="text-sm text-[var(--bio-text-muted)]">
            Your biological data is{" "}
            <span className="text-[var(--bio-text)]">encrypted, anonymized, and never sold.</span>{" "}
            GDPR-compliant. EU-hosted. You own your Bio-Profile.
          </p>
        </div>
      </div>
    </section>
  )
}
