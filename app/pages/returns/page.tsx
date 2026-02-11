import type { Metadata } from "next"
import Link from "next/link"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { RotateCcw, ShieldCheck, Clock, Mail } from "lucide-react"

export const metadata: Metadata = {
  title: "Returns & Refunds | Crazy Gels",
  description:
    "Crazy Gels return and refund policy. 14-day returns for unopened items. Learn about our hassle-free return process.",
}

const steps = [
  { icon: Mail, title: "Contact Us", desc: "Email hello@crazygels.com with your order number and reason for return." },
  { icon: RotateCcw, title: "Ship It Back", desc: "We will provide a return address. Pack items securely in original packaging." },
  { icon: Clock, title: "Processing", desc: "Returns are processed within 5-7 business days of receipt." },
  { icon: ShieldCheck, title: "Refund Issued", desc: "Refund is credited to your original payment method." },
]

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Policy
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4 text-balance">
            Returns & Refunds
          </h1>
          <p className="text-[#777] text-sm md:text-base max-w-xl mx-auto">
            We want you to be satisfied with every purchase. If something is not right, we are here to help.
          </p>
        </div>

        {/* Return process steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {steps.map((s, i) => (
            <div key={s.title} className="border border-[#1A1A1A] bg-[#111] p-5 text-center relative">
              <span className="absolute top-2 right-3 font-mono text-[10px] text-[#00D4AA]/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <s.icon className="w-5 h-5 text-[#00D4AA] mx-auto mb-3" />
              <p className="text-xs font-semibold text-[#E8E8E8] mb-1">{s.title}</p>
              <p className="text-[10px] text-[#777] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Policy details */}
        <div className="space-y-6 text-sm text-[#999] leading-relaxed">
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Return Window</h2>
            <p>
              You may return eligible items within 14 days of delivery. Items must be unopened, unused, and in their original packaging to qualify for a full refund.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Non-Returnable Items</h2>
            <p>
              For hygiene and safety reasons, opened skincare, haircare, and nail products cannot be returned. Damaged or defective items are always eligible for replacement or refund.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Return Shipping</h2>
            <p>
              Return shipping costs are the responsibility of the customer, unless the item was received damaged or defective. We recommend using a tracked shipping service.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Refund Timeline</h2>
            <p>
              Refunds are processed within 5-7 business days of receiving the returned item. It may take an additional 3-5 business days for the refund to appear on your statement.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Damaged Items</h2>
            <p>
              If your item arrived damaged, please email us at{" "}
              <a href="mailto:hello@crazygels.com" className="text-[#00D4AA] hover:underline">
                hello@crazygels.com
              </a>{" "}
              within 48 hours of delivery with photos of the damage. We will arrange a replacement or full refund at no extra cost.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#1A1A1A] text-center">
          <p className="text-sm text-[#777]">
            Need help with a return?{" "}
            <Link href="/pages/contact" className="text-[#00D4AA] hover:underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
