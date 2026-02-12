import Link from 'next/link';
import { BarChart3, Download, CheckCircle, ArrowRight, Database } from 'lucide-react';

const adminTools = [
  {
    title: 'Product Intelligence',
    description:
      'View scraped products, demand signals, efficacy scores, and source details. Manage the research-to-stock pipeline.',
    href: '/admin/intelligence',
    icon: BarChart3,
    accent: '#9E6B73',
  },
  {
    title: 'Export Products',
    description:
      'Download all Shopify products as a CSV with optimized SEO titles, descriptions, and Google Shopping fields.',
    href: '/admin/export',
    icon: Download,
    accent: '#6B5B4F',
  },
  {
    title: 'Shopify Validation',
    description:
      'Verify your Shopify integration status, check collection counts, and validate product data integrity.',
    href: '/admin/validation',
    icon: CheckCircle,
    accent: '#4A7C59',
  },
  {
    title: 'Scraper DB Test',
    description:
      'Test the scraper-to-database pipeline. Setup tables, import scraped JSON, and verify products in the catalog.',
    href: '/admin/scraper-test',
    icon: Database,
    accent: '#5B7E9E',
  },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E8E4DC]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
              Internal
            </p>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
              Admin Dashboard
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
          >
            Back to Site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-3">
          {adminTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6 transition-all duration-300 hover:border-[#9E6B73]/40 hover:shadow-lg"
            >
              <div
                className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${tool.accent}18`,
                  color: tool.accent,
                }}
              >
                <tool.icon className="h-6 w-6" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-[#1A1A1A] group-hover:text-[#9E6B73] transition-colors">
                {tool.title}
              </h2>
              <p className="mb-6 flex-1 text-sm text-[#666666] leading-relaxed">
                {tool.description}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[#9E6B73]">
                Open
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
