import type { Metadata } from "next"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { BeautyCategoriesSection } from "@/components/home/beauty-categories-section"
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

export const metadata: Metadata = {
  title: "Crazy Gels | Skincare, Cosmetics, Beauty Tools & AI Beauty Consultant",
  description:
    "Shop skincare, cosmetics, beauty tools, hair care, and semi-cured gel nail wraps at Crazy Gels. Get free AI beauty recommendations for your routine.",
  keywords: [
    "skincare products",
    "cosmetics",
    "beauty tools",
    "makeup",
    "AI beauty consultant",
    "skin care",
    "hair care products",
    "gel nail wraps",
    "beauty recommendations",
  ],
  alternates: {
    canonical: "https://crazygels.com",
  },
  openGraph: {
    title: "Crazy Gels | Skincare, Cosmetics, Beauty Tools & AI Beauty Consultant",
    description:
      "Discover skincare, cosmetics, beauty tools, hair care, and nail care with personalized AI beauty recommendations.",
    url: "https://crazygels.com",
    siteName: "Crazy Gels",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Crazy Gels beauty products" }],
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crazy Gels | Skincare, Cosmetics & Beauty Tools",
    description: "Shop beauty products and get free AI-powered recommendations for your routine.",
    images: ["/og-image.jpg"],
  },
}

const homeJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Crazy Gels",
  url: "https://crazygels.com",
  description:
    "Shop skincare, cosmetics, beauty tools, hair care, and semi-cured gel nail wraps with AI-powered beauty recommendations.",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Skincare", url: "https://crazygels.com/collections/skincare" },
      { "@type": "ListItem", position: 2, name: "Cosmetics", url: "https://crazygels.com/collections/cosmetics" },
      { "@type": "ListItem", position: 3, name: "Beauty Tools", url: "https://crazygels.com/collections/treatments" },
      { "@type": "ListItem", position: 4, name: "Hair Care", url: "https://crazygels.com/collections/haircare" },
      { "@type": "ListItem", position: 5, name: "Gel Nail Wraps", url: "https://crazygels.com/collections/gel-nail-wraps" },
    ],
  },
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bio-dark)]">
      {/* Announcement Bar */}
      <div className="bg-[var(--bio-teal)] py-2 md:py-2.5">
        <p className="text-center text-[10px] md:text-[11px] font-medium tracking-[0.15em] md:tracking-[0.2em] text-[var(--bio-dark)] uppercase px-4">
          Free AI Beauty Consultant — Get Personalized Product Recommendations Today
        </p>
      </div>

      <DynamicHeader />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
        />
        <HeroSection />
        <BeautyCategoriesSection />
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
