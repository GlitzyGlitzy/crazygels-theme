'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, Star, AlertTriangle } from 'lucide-react';

interface ProductMapping {
  asin: string;
  handle: string;
  productId: string;
  title?: string;
}

interface ImportResult {
  asin: string;
  handle: string;
  scraped: number;
  imported: number;
  errors?: string[];
  message: string;
  status: 'success' | 'error' | 'pending';
}

const EXAMPLE_MAPPING = `# Paste your ASIN to product mappings below (one per line)
# Format: ASIN | product-handle | shopify-product-id | product-title (optional)
#
# Example:
# B07Z4J9FMR | cerave-moisturizing-cream | 8234567890123 | CeraVe Moisturizing Cream
# B08XY2Z3W4 | gel-nail-wraps-rose-gold | 8234567890456 | Rose Gold Gel Nail Wraps

`;

export default function ImportReviewsPage() {
  const [mappingText, setMappingText] = useState(EXAMPLE_MAPPING);
  const [marketplace, setMarketplace] = useState('de');
  const [results, setResults] = useState<ImportResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const parseMappings = useCallback((): ProductMapping[] => {
    const lines = mappingText.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    return lines
      .map((line) => {
        const parts = line.split('|').map((p) => p.trim());
        if (parts.length < 3) return null;
        return {
          asin: parts[0],
          handle: parts[1],
          productId: parts[2],
          title: parts[3] || parts[1],
        };
      })
      .filter(Boolean) as ProductMapping[];
  }, [mappingText]);

  const runImport = async () => {
    const mappings = parseMappings();
    if (mappings.length === 0) return;

    setIsRunning(true);
    setResults([]);
    setTotalProducts(mappings.length);
    setCurrentIndex(0);

    const newResults: ImportResult[] = [];

    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      setCurrentIndex(i + 1);

      // Add pending result
      const pendingResult: ImportResult = {
        asin: mapping.asin,
        handle: mapping.handle,
        scraped: 0,
        imported: 0,
        message: 'Importing...',
        status: 'pending',
      };
      setResults([...newResults, pendingResult]);

      try {
        const res = await fetch('/api/admin/import-amazon-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            asin: mapping.asin,
            handle: mapping.handle,
            productId: mapping.productId,
            marketplace,
          }),
        });

        const data = await res.json();

        const result: ImportResult = {
          asin: mapping.asin,
          handle: mapping.handle,
          scraped: data.scraped || 0,
          imported: data.imported || 0,
          errors: data.errors,
          message: data.message || data.error || 'Unknown result',
          status: res.ok && data.imported > 0 ? 'success' : res.ok ? 'success' : 'error',
        };
        newResults.push(result);
        setResults([...newResults]);
      } catch (error) {
        newResults.push({
          asin: mapping.asin,
          handle: mapping.handle,
          scraped: 0,
          imported: 0,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
          status: 'error',
        });
        setResults([...newResults]);
      }

      // Delay between products to avoid Amazon rate limiting
      if (i < mappings.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    setIsRunning(false);
  };

  const mappingCount = parseMappings().length;
  const totalScraped = results.reduce((s, r) => s + r.scraped, 0);
  const totalImported = results.reduce((s, r) => s + r.imported, 0);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E8E4DC] bg-[#FAFAF8]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#6B5B4F] hover:text-[#9E6B73] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Admin</span>
          </Link>
          <div className="h-4 w-px bg-[#E8E4DC]" />
          <h1 className="text-lg font-semibold text-[#2C2420] tracking-tight">
            Amazon Review Importer
          </h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Instructions */}
        <div className="bg-[#F5F0EB] border border-[#E8E4DC] rounded-xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#9E6B73] mt-0.5 shrink-0" />
            <div>
              <h2 className="font-semibold text-[#2C2420] mb-2">How it works</h2>
              <ol className="text-sm text-[#6B5B4F] space-y-1.5 list-decimal list-inside">
                <li>Paste your ASIN-to-product mappings below (one per line)</li>
                <li>
                  Format: <code className="bg-white/70 px-1.5 py-0.5 rounded text-xs font-mono">ASIN | product-handle | shopify-product-id</code>
                </li>
                <li>Click Import -- it scrapes up to 30 Amazon reviews per product</li>
                <li>Reviews are pushed directly to Judge.me via their API</li>
                <li>Reviews appear on your product pages within 1 hour (cache)</li>
              </ol>
              <p className="text-xs text-[#8A7B6F] mt-3">
                To find your Shopify product ID: go to Shopify Admin {'>'} Products {'>'} click a product {'>'} the number in the URL is the ID.
                Or use the product export CSV from the Export admin page.
              </p>
            </div>
          </div>
        </div>

        {/* Marketplace selector */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-[#2C2420]">Amazon Marketplace:</label>
          <select
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
            className="px-3 py-1.5 border border-[#E8E4DC] rounded-lg bg-white text-sm text-[#2C2420] focus:outline-none focus:ring-2 focus:ring-[#9E6B73]/30"
          >
            <option value="de">amazon.de (Germany)</option>
            <option value="com">amazon.com (US)</option>
            <option value="uk">amazon.co.uk (UK)</option>
            <option value="fr">amazon.fr (France)</option>
            <option value="it">amazon.it (Italy)</option>
            <option value="es">amazon.es (Spain)</option>
          </select>
        </div>

        {/* Mapping input */}
        <div className="bg-white border border-[#E8E4DC] rounded-xl overflow-hidden mb-6">
          <textarea
            value={mappingText}
            onChange={(e) => setMappingText(e.target.value)}
            rows={12}
            className="w-full px-5 py-4 font-mono text-sm text-[#2C2420] bg-white resize-y focus:outline-none"
            placeholder="ASIN | product-handle | shopify-product-id | product-title"
            disabled={isRunning}
          />
          <div className="border-t border-[#E8E4DC] px-5 py-3 flex items-center justify-between bg-[#FAFAF8]">
            <span className="text-sm text-[#6B5B4F]">
              {mappingCount} product{mappingCount !== 1 ? 's' : ''} ready to import
            </span>
            <button
              onClick={runImport}
              disabled={isRunning || mappingCount === 0}
              className="flex items-center gap-2 px-5 py-2 bg-[#9E6B73] text-white text-sm font-medium rounded-lg hover:bg-[#8A5C64] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRunning ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing {currentIndex}/{totalProducts}...</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>Import Reviews</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-3">
            {/* Summary bar */}
            <div className="bg-white border border-[#E8E4DC] rounded-xl p-5 flex items-center gap-8">
              <div>
                <div className="text-2xl font-bold text-[#2C2420]">{totalScraped}</div>
                <div className="text-xs text-[#8A7B6F] uppercase tracking-wider">Scraped</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#4A7C59]">{totalImported}</div>
                <div className="text-xs text-[#8A7B6F] uppercase tracking-wider">Imported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#2C2420]">
                  {results.filter((r) => r.status === 'success').length}/{results.length}
                </div>
                <div className="text-xs text-[#8A7B6F] uppercase tracking-wider">Products</div>
              </div>
            </div>

            {/* Individual results */}
            {results.map((result, i) => (
              <div
                key={i}
                className="bg-white border border-[#E8E4DC] rounded-xl p-4 flex items-center gap-4"
              >
                {result.status === 'pending' ? (
                  <Loader2 className="w-5 h-5 text-[#9E6B73] animate-spin shrink-0" />
                ) : result.status === 'success' && result.imported > 0 ? (
                  <CheckCircle className="w-5 h-5 text-[#4A7C59] shrink-0" />
                ) : result.status === 'success' && result.scraped === 0 ? (
                  <AlertTriangle className="w-5 h-5 text-[#C4973B] shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-[#2C2420] font-medium">
                      {result.asin}
                    </span>
                    <span className="text-[#E8E4DC]">{'>'}</span>
                    <span className="text-sm text-[#6B5B4F] truncate">{result.handle}</span>
                  </div>
                  <p className="text-xs text-[#8A7B6F] mt-0.5">{result.message}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 text-[#C4973B] fill-[#C4973B]" />
                  <span className="text-sm font-medium text-[#2C2420]">
                    {result.imported}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
