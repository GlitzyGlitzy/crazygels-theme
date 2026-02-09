import Link from 'next/link';
import { Instagram } from 'lucide-react';
import { NewsletterForm } from '@/components/klaviyo/newsletter-form';
import { CrazyGelsIcon } from '@/components/ui/crazy-gels-logo';

export function Footer() {
  return (
    <footer className="bg-[#2C2C2C]" role="contentinfo" itemScope itemType="https://schema.org/WPFooter">
      {/* Newsletter signup -- Klaviyo connected */}
      <section className="border-b border-white/10" aria-label="Newsletter signup">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
            <div className="text-center lg:text-left shrink-0 lg:max-w-xs">
              <p className="text-[#B76E79] text-xs font-medium tracking-[0.25em] uppercase mb-2">
                Exclusive Perks
              </p>
              <h2 className="text-xl md:text-2xl font-light tracking-wide text-[#FAF7F2] leading-snug mb-2">
                Join the <span className="italic text-[#B76E79]">Inner Circle</span>
              </h2>
              <p className="text-[#FAF7F2]/50 text-sm leading-relaxed">
                Be the first to know about new drops, member-only deals, and beauty secrets.
              </p>
            </div>
            <div className="flex-1 w-full">
              <NewsletterForm />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <CrazyGelsIcon className="w-8 h-8 md:w-9 md:h-9 brightness-150" />
              <span className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#FAF7F2]">
                CRAZY <span className="text-[#B76E79]">GELS</span>
              </span>
            </Link>
            <p className="text-[#FAF7F2]/70 text-sm leading-relaxed mt-4 mb-6">
              Premium semi-cured gel nails for the discerning woman. Salon-quality elegance at home.
            </p>
            <div className="flex gap-3">
              {[
                { name: "Instagram", label: "Follow us on Instagram", href: "https://www.instagram.com/crazy.gels" },
                { name: "TikTok", label: "Follow us on TikTok", href: "https://www.tiktok.com/@cazygels" },
                { name: "Facebook", label: "Follow us on Facebook", href: "https://www.facebook.com/crazygels" }
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 border border-[#B76E79]/20 flex items-center justify-center text-[#FAF7F2]/70 hover:text-[#B76E79] hover:border-[#B76E79]/50 transition-all"
                  aria-label={social.label}
                >
                  <Instagram className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {[
            { title: "Shop", links: [{ name: "Gel Nail Wraps", href: "/collections/gel-nail-wraps" }, { name: "French Styles", href: "/collections/french-styles" }, { name: "Haircare", href: "/collections/haircare" }, { name: "Skincare", href: "/collections/skincare" }, { name: "Treatments", href: "/collections/treatments" }] },
            { title: "Help", links: [{ name: "FAQ", href: "/pages/faq" }, { name: "Shipping", href: "/pages/shipping" }, { name: "Returns", href: "/pages/returns" }, { name: "Contact", href: "/pages/contact" }] },
            { title: "Company", links: [{ name: "About", href: "/pages/about" }, { name: "Blog", href: "/blog" }, { name: "Careers", href: "/pages/careers" }, { name: "Press", href: "/pages/press" }] }
          ].map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-[#FAF7F2] font-medium uppercase tracking-widest text-sm mb-4 md:mb-6">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-[#FAF7F2]/70 hover:text-[#B76E79] transition-colors text-sm">
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
            &copy; {new Date().getFullYear()} Crazy Gels. All rights reserved.
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
