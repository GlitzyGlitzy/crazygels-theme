import type { Metadata } from "next"
import Link from "next/link"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { ChevronDown } from "lucide-react"

export const metadata: Metadata = {
  title: "FAQ | Crazy Gels",
  description:
    "Frequently asked questions about Crazy Gels biohacking beauty products, bio-analysis, shipping, returns, and more.",
}

const faqs = [
  {
    category: "Bio-Analysis",
    questions: [
      {
        q: "What is the Bio-Analysis?",
        a: "Our AI-powered bio-analysis scans your skin, hair, and nails to identify root causes behind your beauty concerns. It analyzes 147 biological markers and returns a personalized Bio-Score with targeted product recommendations.",
      },
      {
        q: "Is the Bio-Analysis really free?",
        a: "Yes, the basic Bio-Analysis (skin and hair consultation) is completely free. You receive your Bio-Score, root-cause insights, and product recommendations at no cost.",
      },
      {
        q: "How accurate is the AI analysis?",
        a: "Our AI uses advanced computer vision (GPT-4V) trained on dermatological datasets. While it provides highly relevant insights and product matches, it is not a medical diagnosis. For serious concerns, always consult a healthcare professional.",
      },
    ],
  },
  {
    category: "Products & Orders",
    questions: [
      {
        q: "What types of products do you sell?",
        a: "We offer skincare, haircare, nail products (semi-cured gel wraps), fragrances, and beauty tools/treatments. All curated to work as part of an interconnected biological optimization system.",
      },
      {
        q: "Are your products tested on animals?",
        a: "No. All Crazy Gels products are cruelty-free. We do not test on animals and only work with suppliers who share this commitment.",
      },
      {
        q: "How do I track my order?",
        a: "Once your order ships, you will receive an email with a tracking number and link. You can also check your order status by contacting us at hello@crazygels.com.",
      },
    ],
  },
  {
    category: "Shipping & Returns",
    questions: [
      {
        q: "Where do you ship?",
        a: "We ship across Europe (EU and UK). Delivery times vary by location, typically 5-12 business days. See our Shipping page for full details.",
      },
      {
        q: "Can I return a product?",
        a: "Yes, we accept returns within 14 days of delivery for unopened products in original packaging. See our Returns page for the full policy.",
      },
      {
        q: "Is shipping free?",
        a: "We offer free standard shipping on orders over \u20AC50 within the EU. Orders below \u20AC50 have a flat \u20AC4.95 shipping fee.",
      },
    ],
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-[#1A1A1A] last:border-b-0">
      <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none text-left">
        <span className="text-sm md:text-base font-medium text-[#E8E8E8] group-open:text-[#00D4AA] transition-colors">
          {q}
        </span>
        <ChevronDown className="w-4 h-4 text-[#777] shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <p className="text-sm text-[#999] leading-relaxed pb-5 pr-8">{a}</p>
    </details>
  )
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Support
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4 text-balance">
            Frequently Asked Questions
          </h1>
          <p className="text-[#777] text-sm md:text-base">
            {"Can't find what you're looking for? "}
            <Link href="/pages/contact" className="text-[#00D4AA] hover:underline">
              Contact us
            </Link>
            .
          </p>
        </div>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-[#00D4AA] uppercase mb-4">
                {section.category}
              </h2>
              <div className="border border-[#1A1A1A] bg-[#111]">
                {section.questions.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
