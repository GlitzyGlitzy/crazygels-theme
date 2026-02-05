import Link from 'next/link';
import { Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#2C2C2C]" role="contentinfo">
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h2 className="text-xl md:text-2xl font-light tracking-[0.1em] text-[#FAF7F2] mb-2">
                JOIN OUR <span className="text-[#D4AF37]">INNER CIRCLE</span>
              </h2>
              <p className="text-[#FAF7F2]/70">Receive exclusive offers and beauty insights</p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto" aria-label="Newsletter signup">
              <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="Enter your email"
                required
                className="px-6 py-4 bg-white/5 border border-[#D4AF37]/30 rounded-full text-[#FAF7F2] placeholder:text-[#FAF7F2]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-colors w-full sm:w-80"
              />
              <button
                type="submit"
                className="px-8 py-4 bg-[#D4AF37] text-[#2C2C2C] font-medium tracking-wide rounded-full hover:bg-[#B8860B] transition-colors focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              >
                SUBSCRIBE
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block">
              <span className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#FAF7F2]">
                CRAZY <span className="text-[#D4AF37]">GELS</span>
              </span>
            </Link>
            <p className="text-[#FAF7F2]/70 text-sm leading-relaxed mt-4 mb-6">
              Premium semi-cured gel nails for the discerning woman. Salon-quality elegance at home.
            </p>
            <div className="flex gap-3">
              {[
                { name: "Instagram", label: "Follow us on Instagram", href: "https://instagram.com/crazygels" },
                { name: "TikTok", label: "Follow us on TikTok", href: "https://tiktok.com/@crazygels" },
                { name: "Facebook", label: "Follow us on Facebook", href: "https://facebook.com/crazygels" }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-[#D4AF37]/20 flex items-center justify-center text-[#FAF7F2]/70 hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"
                  aria-label={social.label}
                >
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Shop", links: [{ name: "Nails", href: "/collections/nails" }, { name: "Hair", href: "/collections/hair" }, { name: "Skin", href: "/collections/skin" }, { name: "Bundles", href: "/collections/bundles" }, { name: "Sale", href: "/collections/sale" }] },
            { title: "Help", links: [{ name: "FAQ", href: "/pages/faq" }, { name: "Shipping", href: "/pages/shipping" }, { name: "Returns", href: "/pages/returns" }, { name: "Contact", href: "/pages/contact" }] },
            { title: "Company", links: [{ name: "About", href: "/pages/about" }, { name: "Blog", href: "/blog" }, { name: "Careers", href: "/pages/careers" }, { name: "Press", href: "/pages/press" }] }
          ].map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[#FAF7F2] font-medium uppercase tracking-widest text-sm mb-4 md:mb-6">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-[#FAF7F2]/70 hover:text-[#D4AF37] transition-colors text-sm">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#FAF7F2]/50 text-xs text-center md:text-left">
            &copy; 2025 Crazy Gels. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#FAF7F2]/70">
            <Link href="/pages/privacy" className="hover:text-[#FAF7F2] transition-colors">Privacy Policy</Link>
            <Link href="/pages/terms" className="hover:text-[#FAF7F2] transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
