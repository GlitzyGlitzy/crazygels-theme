import { Camera, Zap, RefreshCw } from "lucide-react"

const steps = [
  {
    number: "01",
    title: "SCAN",
    icon: Camera,
    description:
      "Upload three photos. 30 seconds. Our AI analyzes 147 biological markers across your skin, scalp, and nails. No questionnaires. No guessing.",
  },
  {
    number: "02",
    title: "OPTIMIZE",
    icon: Zap,
    description:
      "Receive your Bio-Score and personalized protocol. Not products \u2014 biological interventions. Skin serum + scalp treatment + nail complex, engineered to work as one system.",
  },
  {
    number: "03",
    title: "EVOLVE",
    icon: RefreshCw,
    description:
      "Your biology changes weekly. Your environment changes daily. Your formulas adapt in real-time. UV spike? Antioxidants increase. Stress week? Anti-inflammatories activate.",
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative bg-[var(--bio-darker)] py-16 md:py-24 lg:py-32">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--bio-teal)]/20 to-transparent" />

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-12">
        <div className="text-center mb-12 md:mb-16">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[var(--bio-teal)] uppercase mb-4">
            How It Works
          </p>
          <h2 className="font-serif text-2xl md:text-4xl lg:text-5xl font-light text-[var(--bio-text)] text-balance">
            Three Steps to Biological Optimization
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[calc(50%+40px)] right-[-calc(50%-40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-[var(--bio-teal)]/20 to-[var(--bio-teal)]/5 translate-x-[40px]" />
              )}

              <div className="text-center">
                {/* Step number */}
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border border-[var(--bio-teal)]/20" />
                  <div className="absolute inset-1 rounded-full bg-[var(--bio-card)] flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-[var(--bio-teal)]" />
                  </div>
                  <span className="absolute -top-2 -right-2 font-mono text-[10px] font-bold text-[var(--bio-teal)] bg-[var(--bio-darker)] px-1.5 py-0.5 border border-[var(--bio-teal)]/20">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-mono text-base font-semibold text-[var(--bio-teal)] tracking-[0.2em] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--bio-text-muted)] leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
