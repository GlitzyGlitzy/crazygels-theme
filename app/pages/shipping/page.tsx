import type { Metadata } from "next"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { Truck, Clock, Globe, Package } from "lucide-react"

export const metadata: Metadata = {
  title: "Shipping & Delivery | Crazy Gels",
  description:
    "Crazy Gels shipping information. Free EU shipping on orders over \u20AC50. Delivery times, tracking, and international shipping details.",
}

const shippingZones = [
  { zone: "Germany, Austria, Netherlands", time: "3-5 business days", cost: "\u20AC4.95", free: "\u20AC50+" },
  { zone: "France, Belgium, Luxembourg", time: "5-7 business days", cost: "\u20AC5.95", free: "\u20AC50+" },
  { zone: "Rest of EU", time: "7-10 business days", cost: "\u20AC6.95", free: "\u20AC75+" },
  { zone: "United Kingdom", time: "7-12 business days", cost: "\u20AC8.95", free: "\u20AC100+" },
]

const highlights = [
  { icon: Truck, title: "Free Shipping", desc: "On EU orders over \u20AC50" },
  { icon: Clock, title: "Fast Processing", desc: "Orders ship within 1-3 days" },
  { icon: Globe, title: "EU-Wide Delivery", desc: "We ship across Europe" },
  { icon: Package, title: "Tracked Parcels", desc: "Full tracking on every order" },
]

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Delivery
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4 text-balance">
            Shipping & Delivery
          </h1>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {highlights.map((h) => (
            <div key={h.title} className="border border-[#1A1A1A] bg-[#111] p-4 text-center">
              <h.icon className="w-5 h-5 text-[#00D4AA] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#E8E8E8] mb-0.5">{h.title}</p>
              <p className="text-[10px] text-[#777]">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Shipping table */}
        <div className="border border-[#1A1A1A] bg-[#111] overflow-hidden mb-12">
          <div className="grid grid-cols-4 gap-0 text-[10px] font-mono tracking-wider text-[#00D4AA] uppercase border-b border-[#1A1A1A] bg-[#0D0D0D]">
            <div className="p-3 md:p-4">Region</div>
            <div className="p-3 md:p-4">Delivery</div>
            <div className="p-3 md:p-4">Cost</div>
            <div className="p-3 md:p-4">Free From</div>
          </div>
          {shippingZones.map((zone) => (
            <div key={zone.zone} className="grid grid-cols-4 gap-0 border-b border-[#1A1A1A] last:border-b-0">
              <div className="p-3 md:p-4 text-xs text-[#E8E8E8]">{zone.zone}</div>
              <div className="p-3 md:p-4 text-xs text-[#999]">{zone.time}</div>
              <div className="p-3 md:p-4 text-xs text-[#999]">{zone.cost}</div>
              <div className="p-3 md:p-4 text-xs text-[#00D4AA] font-medium">{zone.free}</div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="space-y-6 text-sm text-[#999] leading-relaxed">
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Order Processing</h2>
            <p>
              Orders are processed within 1-3 business days (Monday-Friday, excluding holidays). You will receive an email confirmation with tracking details once your order ships.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Tracking Your Order</h2>
            <p>
              All shipments include tracking. Once dispatched, you will receive a tracking number via email. If you have not received tracking within 5 business days, please contact us.
            </p>
          </div>
          <div>
            <h2 className="text-[#E8E8E8] font-medium mb-2">Customs & Duties</h2>
            <p>
              For EU shipments, all applicable taxes are included in the product price. UK orders may be subject to import duties which are the responsibility of the customer.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
