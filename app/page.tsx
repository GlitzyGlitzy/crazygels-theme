import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { ProblemSection } from "@/components/home/problem-section"
import { BioScanSection } from "@/components/home/bio-scan-section"
import { HowItWorksSection } from "@/components/home/how-it-works-section"
import { ComparisonSection } from "@/components/home/comparison-section"
import { TechnologySection } from "@/components/home/technology-section"
import { SocialProofSection } from "@/components/home/social-proof-section"
import { BioProductsSection } from "@/components/home/bio-products-section"
import { PricingSection } from "@/components/home/pricing-section"
import { FinalCtaSection } from "@/components/home/final-cta-section"

export const revalidate = 300

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bio-dark)]">
      {/* Announcement Bar */}
      <div className="bg-[var(--bio-teal)] py-2 md:py-2.5">
        <p className="text-center text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-[var(--bio-dark)] uppercase px-4">
          Free Bio-Analysis for All New Members — Start Optimizing Today
        </p>
      </div>

      <DynamicHeader />

      <main>
        <HeroSection />
        <ProblemSection />
        <BioScanSection />
        <HowItWorksSection />
        <ComparisonSection />
        <TechnologySection />
        <SocialProofSection />
        <BioProductsSection />
        <PricingSection />
        <FinalCtaSection />
      </main>

      <Footer />
    </div>
  )
}
