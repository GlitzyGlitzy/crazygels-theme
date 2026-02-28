'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Rocket, Loader2, CheckCircle, XCircle, Package, AlertTriangle } from 'lucide-react';

interface ListResult {
  product_hash: string;
  name: string;
  shopify_id: string;
  price: string;
  status: string;
}

interface ListError {
  product_hash: string;
  name: string;
  error: string;
}

interface BatchResponse {
  success: boolean;
  listed: number;
  failed: number;
  remaining: number;
  results: ListResult[];
  errors?: ListError[];
}

interface Stats {
  total_ready: number;
  total_listed: number;
  categories: { category: string; ready: number; listed: number }[];
}

export default function BulkListPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [inventory, setInventory] = useState(50);
  const [allResults, setAllResults] = useState<ListResult[]>([]);
  const [allErrors, setAllErrors] = useState<ListError[]>([]);
  const [batchCount, setBatchCount] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [autoRun, setAutoRun] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/bulk-list', {
        headers: { 'x-admin-token': 'admin_crazygels' },
      });
      const data = await res.json();
      setStats(data);
      setRemaining(data.total_ready);
    } catch {
      console.error('Failed to fetch stats');
    }
    setLoading(false);
  }, []);

  const runBatch = useCallback(async (): Promise<BatchResponse | null> => {
    try {
      const res = await fetch('/api/admin/bulk-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'admin_crazygels',
        },
        body: JSON.stringify({
          batch_size: batchSize,
          activate: true,
          inventory,
        }),
      });
      const data: BatchResponse = await res.json();
      if (data.results) {
        setAllResults((prev) => [...prev, ...data.results]);
      }
      if (data.errors) {
        setAllErrors((prev) => [...prev, ...data.errors]);
      }
      setBatchCount((prev) => prev + 1);
      setRemaining(data.remaining);
      return data;
    } catch {
      return null;
    }
  }, [batchSize, inventory]);

  const startBulkList = useCallback(async () => {
    setRunning(true);
    setAllResults([]);
    setAllErrors([]);
    setBatchCount(0);

    if (autoRun) {
      let hasMore = true;
      while (hasMore) {
        const result = await runBatch();
        if (!result || result.remaining <= 0 || result.listed === 0) {
          hasMore = false;
        }
        // Small delay between batches
        await new Promise((r) => setTimeout(r, 2000));
      }
    } else {
      await runBatch();
    }

    setRunning(false);
    fetchStats();
  }, [autoRun, runBatch, fetchStats]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-[#8A7B6F] hover:text-[#2D2A26] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[#2D2A26] flex items-center gap-3">
            <Rocket className="w-6 h-6 text-[#B76E79]" />
            Bulk Product Launcher
          </h1>
          <p className="text-sm text-[#8A7B6F] mt-1">
            Push intelligence products with images to Shopify, set competitive prices, and activate them for sale.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white border border-[#E8E0D8] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-[#2D2A26]">Pipeline Status</h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="text-sm px-4 py-2 bg-[#F5F0EB] text-[#2D2A26] rounded hover:bg-[#E8E0D8] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Stats'}
            </button>
          </div>

          {stats ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#F5F0EB] rounded-lg p-4">
                  <p className="text-2xl font-bold text-[#B76E79]">{stats.total_ready}</p>
                  <p className="text-xs text-[#8A7B6F]">Ready to list (have images)</p>
                </div>
                <div className="bg-[#F5F0EB] rounded-lg p-4">
                  <p className="text-2xl font-bold text-[#2D2A26]">{stats.total_listed}</p>
                  <p className="text-xs text-[#8A7B6F]">Already listed</p>
                </div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {stats.categories.map((cat) => (
                  <div key={cat.category} className="flex justify-between text-sm py-1 border-b border-[#F5F0EB]">
                    <span className="text-[#2D2A26] font-medium">{cat.category}</span>
                    <span className="text-[#8A7B6F]">
                      {cat.ready} ready / {cat.listed} listed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#8A7B6F]">Click Refresh Stats to see what is ready to list.</p>
          )}
        </div>

        {/* Controls */}
        <div className="bg-white border border-[#E8E0D8] rounded-lg p-6 mb-6">
          <h2 className="font-medium text-[#2D2A26] mb-4">Launch Settings</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-[#8A7B6F] mb-1">Products per batch</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded text-sm bg-white"
              >
                <option value={5}>5 (safe test)</option>
                <option value={10}>10 (recommended)</option>
                <option value={15}>15</option>
                <option value={25}>25 (max per batch)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#8A7B6F] mb-1">Initial inventory per product</label>
              <select
                value={inventory}
                onChange={(e) => setInventory(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E8E0D8] rounded text-sm bg-white"
              >
                <option value={10}>10 units</option>
                <option value={25}>25 units</option>
                <option value={50}>50 units</option>
                <option value={100}>100 units</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="rounded"
              />
              <span className="text-[#2D2A26]">Auto-run all batches</span>
            </label>
            <span className="text-xs text-[#8A7B6F]">
              {autoRun ? 'Will process ALL ready products automatically' : 'Will process one batch at a time'}
            </span>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              Products will be created as <strong>active</strong> in Shopify with inventory.
              They will be visible to customers and available for purchase immediately.
              Prices are set competitively based on Google Shopping benchmarks.
            </p>
          </div>

          <button
            onClick={startBulkList}
            disabled={running}
            className="w-full py-3 bg-[#B76E79] text-white font-semibold rounded-lg hover:bg-[#A25D68] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing batch {batchCount + 1}... ({remaining} remaining)
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                {autoRun ? `Launch All ${stats?.total_ready || '?'} Products` : `Launch Next ${batchSize} Products`}
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {(allResults.length > 0 || allErrors.length > 0) && (
          <div className="bg-white border border-[#E8E0D8] rounded-lg p-6">
            <h2 className="font-medium text-[#2D2A26] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Results ({allResults.length} listed, {allErrors.length} failed)
            </h2>

            {allResults.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-green-700 mb-2">Successfully Listed</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {allResults.map((r) => (
                    <div
                      key={r.product_hash}
                      className="flex items-center justify-between text-sm py-2 border-b border-[#F5F0EB]"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-[#2D2A26]">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#B76E79] font-medium">EUR {r.price}</span>
                        <span className="text-xs text-[#8A7B6F] bg-green-50 px-2 py-0.5 rounded">
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allErrors.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-red-700 mb-2">Failed</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {allErrors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm py-2 border-b border-red-50">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#2D2A26]">{e.name}</span>
                        <p className="text-xs text-red-600 mt-0.5">{e.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
