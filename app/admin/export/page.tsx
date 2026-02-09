'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ExportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleDownload() {
    setLoading(true);
    setError('');
    setDone(false);

    try {
      const res = await fetch('/api/export-products-csv');

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `Export failed (${res.status})`);
      }

      // Get the filename from Content-Disposition or use a default
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch?.[1] || `crazygels-products-${new Date().toISOString().split('T')[0]}.csv`;

      // Read the response as a blob and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

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
            <p className="font-medium text-[#2C2C2C]">{"What's included:"}</p>
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

          <button
            onClick={handleDownload}
            disabled={loading}
            className="block w-full text-center bg-[#2C2C2C] text-[#FAF7F2] py-3 px-6 rounded-lg text-sm font-medium hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Fetching all products... This may take a minute' : done ? 'Downloaded! Click to download again' : 'Download Shopify CSV'}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {done && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
              CSV downloaded successfully. Check your Downloads folder.
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 space-y-2">
            <p className="font-medium">Import instructions:</p>
            <ol className="space-y-1 list-decimal list-inside">
              <li>Download the CSV file above</li>
              <li>{"Go to Shopify Admin > Products"}</li>
              <li>{"Click Import > Choose file"}</li>
              <li>{"Select \"Overwrite existing products with matching handles\""}</li>
              <li>Review and confirm the import</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E8E4DE]">
          <Link href="/" className="text-sm text-[#B76E79] hover:underline">
            {"<- Back to site"}
          </Link>
        </div>
      </div>
    </div>
  );
}
