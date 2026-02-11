import type { Metadata } from "next"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Privacy Policy | Crazy Gels",
  description: "Crazy Gels privacy policy. How we collect, use, and protect your personal and biological data. GDPR compliant.",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Legal
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#777]">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[#999] leading-relaxed">
          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">1. Introduction</h2>
            <p>
              Crazy Gels (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your personal information when you visit our website, use our bio-analysis tools, or purchase our products.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">2. Data We Collect</h2>
            <p className="mb-3">We may collect the following types of data:</p>
            <ul className="space-y-2 pl-4">
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00D4AA] mt-2 shrink-0" />
                <span><span className="text-[#E8E8E8]">Personal information:</span> name, email address, shipping address, payment details (processed securely via Shopify Payments)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00D4AA] mt-2 shrink-0" />
                <span><span className="text-[#E8E8E8]">Bio-Analysis data:</span> skin, hair, and nail consultation responses and AI-generated recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-[#00D4AA] mt-2 shrink-0" />
                <span><span className="text-[#E8E8E8]">Usage data:</span> browsing behavior, device information, and cookies for site analytics</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">3. How We Use Your Data</h2>
            <p>
              We use your data to process orders, provide personalized product recommendations through our bio-analysis, improve our services, and send marketing communications (only with your consent). We never sell your personal or biological data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">4. Bio-Analysis Data</h2>
            <p>
              Data submitted during skin and hair consultations is processed by our AI systems to generate personalized recommendations. This data is not stored permanently and is not used for purposes beyond your individual consultation session. We do not retain images or biometric data.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">5. Cookies</h2>
            <p>
              We use essential cookies for site functionality and optional analytics cookies to understand how visitors use our site. You can manage cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">6. Third-Party Services</h2>
            <p>
              We use trusted third-party services including Shopify (e-commerce), Klaviyo (email marketing with consent), and Vercel (website hosting). Each provider has their own privacy policy and processes data in accordance with GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">7. Your Rights (GDPR)</h2>
            <p className="mb-3">Under GDPR, you have the right to:</p>
            <ul className="space-y-1 pl-4">
              {[
                "Access the personal data we hold about you",
                "Request correction of inaccurate data",
                "Request deletion of your data",
                "Withdraw consent for marketing at any time",
                "Object to data processing",
                "Data portability",
              ].map((right) => (
                <li key={right} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#00D4AA] mt-2 shrink-0" />
                  <span>{right}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">8. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including encryption in transit (TLS) and at rest. All services are EU-hosted where possible.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">9. Contact</h2>
            <p>
              For privacy-related inquiries or to exercise your rights, contact us at{" "}
              <a href="mailto:hello@crazygels.com" className="text-[#00D4AA] hover:underline">
                hello@crazygels.com
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
