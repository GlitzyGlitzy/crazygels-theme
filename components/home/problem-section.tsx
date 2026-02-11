export function ProblemSection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-16 md:py-24 lg:py-32">
      {/* Subtle top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 lg:px-12">
        <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4 text-center">
          The Problem
        </p>

        <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-center mb-8 leading-tight text-balance">
          {"You're Not a Collection of Parts."}
          <br />
          <span className="text-[var(--bio-text-muted)]">So Why Treat Yourself Like One?</span>
        </h2>

        <div className="space-y-6 text-base md:text-lg text-[var(--bio-text-muted)] leading-relaxed max-w-3xl mx-auto">
          <p>
            Your dermatologist looks at your skin. Your trichologist looks at your hair.
            Your manicurist looks at your nails.{" "}
            <span className="text-[var(--bio-text)]">
              None of them talk to each other. None of them see the system.
            </span>
          </p>

          <p>
            The truth:{" "}
            <span className="text-[var(--bio-teal)]">
              brittle nails + thinning hair + dull skin = one biological signal.
            </span>{" "}
            Collagen breakdown. Nutrient deficiency. Oxidative stress. Hormonal disruption.
          </p>

          <p>
            The waste: buying 12 products from 8 brands that don&apos;t know each other exist.
            Hoping something works. Never knowing why it doesn&apos;t.
          </p>
        </div>

        {/* Visual separator */}
        <div className="flex items-center justify-center gap-4 mt-12">
          <div className="h-px w-12 bg-[var(--bio-teal)]/20" />
          <div className="w-2 h-2 rounded-full bg-[var(--bio-teal)]/30" />
          <div className="h-px w-12 bg-[var(--bio-teal)]/20" />
        </div>
      </div>
    </section>
  )
}
