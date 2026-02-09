import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Export Products CSV | Crazy Gels Admin',
  robots: 'noindex, nofollow',
};

export default function ExportPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-xl shadow-sm border border-[#E8E4DE] p-8">
        <h1 className="text-2xl font-light text-[#2C2C2C] mb-2">Export Products CSV</h1>
        <p className="text-sm text-[#2C2C2C]/60 mb-6 leading-relaxed">
          Download all your products in Shopify CSV import format with optimized SEO titles,
          descriptions, Google Shopping categories, and all required fields filled in.
        </p>

        <div className="space-y-4">
          <div className="bg-[#FAF7F2] rounded-lg p-4 text-sm text-[#2C2C2C]/70 space-y-2">
            <p className="font-medium text-[#2C2C2C]">What&apos;s included:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Optimized SEO Title (under 60 chars)</li>
              <li>Optimized SEO Description (keyword-rich, 140-155 chars)</li>
              <li>Google Shopping Product Category</li>
              <li>Google Shopping Condition, Gender, Age Group, MPN</li>
              <li>All variants with pricing and options</li>
              <li>All product images with alt text</li>
              <li>Tags, vendor, product type</li>
              <li>Published status and market availability</li>
            </ul>
          </div>

          <a
            href="/api/export-products-csv"
            className="block w-full text-center bg-[#2C2C2C] text-[#FAF7F2] py-3 px-6 rounded-lg text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
          >
            Download Shopify CSV
          </a>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-2">
            <p className="font-medium">Import instructions:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Download the CSV file above</li>
              <li>Go to Shopify Admin &gt; Products</li>
              <li>Click Import &gt; Choose file</li>
              <li>Select &quot;Overwrite existing products with matching handles&quot;</li>
              <li>Review and confirm the import</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E8E4DE]">
          <Link href="/" className="text-sm text-[#B76E79] hover:underline">
            &larr; Back to site
          </Link>
        </div>
      </div>
    </div>
  );
}
