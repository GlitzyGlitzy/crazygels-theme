import type { Metadata } from "next"
import Link from "next/link"
import { DynamicHeader } from "@/components/layout/dynamic-header"
import { Footer } from "@/components/layout/footer"
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Contact Us | Crazy Gels",
  description:
    "Get in touch with Crazy Gels. Customer support, business inquiries, and feedback. We typically respond within 24 hours.",
}

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    detail: "hello@crazygels.com",
    href: "mailto:hello@crazygels.com",
    desc: "For orders, returns, and general questions",
  },
  {
    icon: MessageCircle,
    title: "Instagram DM",
    detail: "@crazy.gels",
    href: "https://www.instagram.com/crazy.gels",
    desc: "Quick questions and product inquiries",
  },
  {
    icon: Clock,
    title: "Response Time",
    detail: "Within 24 hours",
    href: null,
    desc: "Monday - Friday, 9:00 - 18:00 CET",
  },
  {
    icon: MapPin,
    title: "Based in",
    detail: "European Union",
    href: null,
    desc: "GDPR-compliant, EU-hosted services",
  },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <DynamicHeader />
      <main className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.3em] text-[#00D4AA] uppercase mb-3">
            Get In Touch
          </p>
          <h1 className="font-serif text-3xl md:text-5xl font-light text-[#E8E8E8] mb-4 text-balance">
            Contact Us
          </h1>
          <p className="text-[#777] text-sm md:text-base max-w-xl mx-auto">
            Have a question about your order, our products, or the bio-analysis? We are here to help.
          </p>
        </div>

        {/* Contact cards */}
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {contactMethods.map((method) => {
            const Wrapper = method.href ? "a" : "div"
            const wrapperProps = method.href
              ? {
                  href: method.href,
                  target: method.href.startsWith("http") ? "_blank" as const : undefined,
                  rel: method.href.startsWith("http") ? "noopener noreferrer" : undefined,
                }
              : {}
            return (
              <Wrapper
                key={method.title}
                {...wrapperProps}
                className={`border border-[#1A1A1A] bg-[#111] p-6 transition-all duration-300 ${
                  method.href ? "hover:border-[#00D4AA]/30 cursor-pointer" : ""
                }`}
              >
                <method.icon className="w-5 h-5 text-[#00D4AA] mb-3" />
                <h2 className="text-sm font-medium text-[#E8E8E8] mb-0.5">{method.title}</h2>
                <p className="text-sm text-[#00D4AA] font-medium mb-2">{method.detail}</p>
                <p className="text-xs text-[#777]">{method.desc}</p>
              </Wrapper>
            )
          })}
        </div>

        {/* Quick links */}
        <div className="border border-[#1A1A1A] bg-[#111] p-6">
          <h2 className="font-mono text-xs font-semibold tracking-[0.2em] text-[#00D4AA] uppercase mb-4">
            Common Topics
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Order tracking & shipping", href: "/pages/shipping" },
              { label: "Returns & refunds", href: "/pages/returns" },
              { label: "Product questions (FAQ)", href: "/pages/faq" },
              { label: "Start a Bio-Analysis", href: "/consult" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="flex items-center gap-2 text-sm text-[#999] hover:text-[#00D4AA] transition-colors py-2"
              >
                <span className="w-1 h-1 rounded-full bg-[#00D4AA]/40 shrink-0" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
