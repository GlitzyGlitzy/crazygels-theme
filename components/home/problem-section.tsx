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
          {"Too Many Products."}
          <br />
          <span className="text-[var(--bio-text-muted)]">Not Enough Guidance.</span>
        </h2>

        <div className="space-y-6 text-base md:text-lg text-[var(--bio-text-muted)] leading-relaxed max-w-3xl mx-auto">
          <p>
            Thousands of skincare, hair care, and nail products. Endless influencer recommendations.{" "}
            <span className="text-[var(--bio-text)]">
              How do you know what actually works for you?
            </span>
          </p>

          <p>
            The reality:{" "}
            <span className="text-[var(--bio-teal)]">
              most people waste money on products that are not right for their skin type, hair
              texture, or nail concerns.
            </span>{" "}
            Generic advice leads to generic results.
          </p>

          <p>
            What you need is an expert who understands your unique needs and recommends
            the right products -- not the most expensive ones, not the most hyped ones,
            but the right ones for you.
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
