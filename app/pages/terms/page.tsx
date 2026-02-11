import type { Metadata } from "next"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  title: "Terms of Service | Crazy Gels",
  description: "Crazy Gels terms of service. Rules and guidelines for using our website, products, and bio-analysis services.",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Legal
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4">
            Terms of Service
          </h1>
          <p className="text-xs text-[#777]">Last updated: February 2026</p>
        </div>

        <div className="space-y-8 text-sm text-[#999] leading-relaxed">
          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the Crazy Gels website (crazygels.com) and our services, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">2. Products & Purchases</h2>
            <p className="mb-3">
              All products displayed on our website are subject to availability. Prices are listed in Euros and include applicable VAT for EU customers. We reserve the right to modify prices at any time without notice.
            </p>
            <p>
              Orders are processed through Shopify and are subject to acceptance. We may refuse or cancel orders at our discretion, including in cases of pricing errors, suspected fraud, or product unavailability.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">3. Bio-Analysis Services</h2>
            <p className="mb-3">
              Our AI-powered bio-analysis tools (skin consultation, hair consultation) provide personalized product recommendations based on user input. These services are provided for informational purposes only.
            </p>
            <p>
              <span className="text-[#E8E8E8]">Important:</span> Our bio-analysis is not a medical diagnosis, treatment, or substitute for professional medical advice. If you have skin, hair, or health concerns, consult a qualified healthcare provider.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">4. Shipping & Delivery</h2>
            <p>
              Delivery times are estimates and may vary. Crazy Gels is not responsible for delays caused by shipping carriers, customs processing, or force majeure events. Full shipping details are available on our Shipping page.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">5. Returns & Refunds</h2>
            <p>
              Returns are accepted within 14 days of delivery for unopened products in original packaging. Opened beauty and hygiene products cannot be returned except in cases of defect or damage. Full details are on our Returns page.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">6. Intellectual Property</h2>
            <p>
              All content on this website, including text, graphics, logos, images, and software, is the property of Crazy Gels or its licensors and is protected by copyright and trademark laws. You may not reproduce, distribute, or create derivative works without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">7. User Conduct</h2>
            <p>
              You agree not to misuse our services, including attempting to manipulate the bio-analysis system, engage in fraudulent transactions, or violate any applicable laws when using our platform.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">8. Limitation of Liability</h2>
            <p>
              Crazy Gels shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific product or service in question.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">9. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of the European Union. Any disputes shall be resolved in the courts of the applicable EU member state.
            </p>
          </section>

          <section>
            <h2 className="text-[#E8E8E8] font-medium text-base mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact us at{" "}
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
