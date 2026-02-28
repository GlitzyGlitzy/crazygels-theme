'use client';

import { useState, useCallback, useEffect } from 'react';
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
  message?: string;
}

interface Stats {
  total_ready: number;
  total_listed: number;
  categories: { category: string; ready: number; listed: number }[];
}

/* ------------------------------------------------------------------ */
/*  Auth gate – same pattern as intelligence + stocking pages          */
/* ------------------------------------------------------------------ */
function AdminTokenGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState('');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (token.trim()) onLogin(token.trim());
        }}
        className="mx-4 w-full max-w-sm rounded-2xl border border-[#E8E4DC] bg-white p-8 shadow-sm"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
          Internal Access
        </p>
        <h2 className="mt-1 font-serif text-xl font-light text-[#1A1A1A]">
          Bulk Product Launcher
        </h2>
        <p className="mt-2 text-xs text-[#9B9B9B]">
          Enter your admin token to access the bulk listing tool.
        </p>
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Admin token"
          className="mt-5 h-10 w-full rounded-lg border border-[#E8E4DC] bg-[#FAFAF8] px-4 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
        />
        <button
          type="submit"
          className="mt-3 h-10 w-full rounded-lg bg-[#9E6B73] text-sm font-medium text-white transition-colors hover:bg-[#8A5B63]"
        >
          Access Dashboard
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function BulkListPage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  // Load stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('cg_admin_token') || '';
    if (stored) setAdminToken(stored);
    setTokenReady(true);
  }, []);

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
  const [statusMessage, setStatusMessage] = useState('');

  const fetchStats = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setStatusMessage('');
    console.log("[v0] fetchStats - sending token:", JSON.stringify(adminToken));
    try {
      const res = await fetch('/api/admin/bulk-list', {
        headers: { 'x-admin-token': adminToken },
      });
      console.log("[v0] fetchStats - response status:", res.status);
      if (!res.ok) {
        const err = await res.json();
        console.log("[v0] fetchStats - error response:", JSON.stringify(err));
        if (res.status === 401) {
          // Token is invalid -- clear it and show login gate
          localStorage.removeItem('cg_admin_token');
          setAdminToken(null);
          setStatusMessage('Session expired. Please log in again.');
          setLoading(false);
          return;
        }
        setStatusMessage(`Error: ${err.error || res.statusText}`);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStats(data);
      setRemaining(data.total_ready);
    } catch (err) {
      setStatusMessage(`Network error: ${err instanceof Error ? err.message : 'Failed to fetch'}`);
    }
    setLoading(false);
  }, [adminToken]);

  const runBatch = useCallback(async (): Promise<BatchResponse | null> => {
    if (!adminToken) return null;
    try {
      const res = await fetch('/api/admin/bulk-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({
          batch_size: batchSize,
          activate: true,
          inventory,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setStatusMessage(`Error: ${err.error || res.statusText}`);
        return null;
      }
      const data: BatchResponse = await res.json();
      if (data.results) {
        setAllResults((prev) => [...prev, ...data.results]);
      }
      if (data.errors) {
        setAllErrors((prev) => [...prev, ...data.errors]);
      }
      setBatchCount((prev) => prev + 1);
      setRemaining(data.remaining);
      if (data.message) setStatusMessage(data.message);
      return data;
    } catch (err) {
      setStatusMessage(`Network error: ${err instanceof Error ? err.message : 'Failed'}`);
      return null;
    }
  }, [batchSize, inventory, adminToken]);

  // Auto-fetch stats when token becomes available
  useEffect(() => {
    if (adminToken && tokenReady) {
      fetchStats();
    }
  }, [adminToken, tokenReady, fetchStats]);

  const startBulkList = useCallback(async () => {
    setRunning(true);
    setAllResults([]);
    setAllErrors([]);
    setBatchCount(0);
    setStatusMessage('');

    if (autoRun) {
      let hasMore = true;
      while (hasMore) {
        const result = await runBatch();
        if (!result || result.remaining <= 0 || result.listed === 0) {
          hasMore = false;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    } else {
      await runBatch();
    }

    setRunning(false);
    fetchStats();
  }, [autoRun, runBatch, fetchStats]);

  /* ----- Auth gate ----- */
  if (!tokenReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <Loader2 className="w-6 h-6 animate-spin text-[#9E6B73]" />
      </div>
    );
  }

  if (!adminToken) {
    return (
      <AdminTokenGate
        onLogin={(t) => {
          localStorage.setItem('cg_admin_token', t);
          setAdminToken(t);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]" suppressHydrationWarning>
      {/* Header */}
      <header className="border-b border-[#E8E4DC] bg-[#FAFAF8]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
              Internal
            </p>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A] flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#B76E79]" />
              Bulk Product Launcher
            </h1>
          </div>
          <Link
            href="/admin"
            className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73] flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3 h-3" />
            All Tools
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-sm text-[#8A7B6F] mb-8">
          Push intelligence products with images to Shopify, set competitive Google-benchmarked prices, and activate them for sale.
        </p>

        {/* Status message */}
        {statusMessage && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {statusMessage}
          </div>
        )}

        {/* Stats */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-light text-[#1A1A1A]">Pipeline Status</h2>
            <button
              onClick={fetchStats}
              disabled={loading}
              className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Refresh Stats'}
            </button>
          </div>

          {stats ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl bg-[#F5F0EB] p-5">
                  <p className="text-3xl font-light text-[#B76E79]">{stats.total_ready}</p>
                  <p className="text-xs text-[#8A7B6F] mt-1">Ready to list (have images)</p>
                </div>
                <div className="rounded-xl bg-[#F5F0EB] p-5">
                  <p className="text-3xl font-light text-[#1A1A1A]">{stats.total_listed}</p>
                  <p className="text-xs text-[#8A7B6F] mt-1">Already listed</p>
                </div>
              </div>
              <div className="space-y-0 max-h-48 overflow-y-auto rounded-lg border border-[#E8E4DC]">
                {stats.categories.map((cat) => (
                  <div key={cat.category} className="flex justify-between text-sm py-2.5 px-4 border-b border-[#F5F0EB] last:border-0">
                    <span className="text-[#1A1A1A] font-medium capitalize">{cat.category.replace(/[-_]/g, ' ')}</span>
                    <span className="text-[#8A7B6F] font-mono text-xs">
                      {cat.ready} ready &middot; {cat.listed} listed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#9B9B9B] py-4 text-center">
              Click Refresh Stats to see what is ready to list.
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="rounded-2xl border border-[#E8E4DC] bg-white p-6 mb-6 shadow-sm">
          <h2 className="font-serif text-lg font-light text-[#1A1A1A] mb-4">Launch Settings</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5 uppercase tracking-wider">
                Products per batch
              </label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full h-10 px-3 border border-[#E8E4DC] rounded-lg text-sm bg-[#FAFAF8] text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
              >
                <option value={5}>5 (safe test)</option>
                <option value={10}>10 (recommended)</option>
                <option value={15}>15</option>
                <option value={25}>25 (max per batch)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B5B4F] mb-1.5 uppercase tracking-wider">
                Initial inventory
              </label>
              <select
                value={inventory}
                onChange={(e) => setInventory(Number(e.target.value))}
                className="w-full h-10 px-3 border border-[#E8E4DC] rounded-lg text-sm bg-[#FAFAF8] text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
              >
                <option value={10}>10 units</option>
                <option value={25}>25 units</option>
                <option value={50}>50 units</option>
                <option value={100}>100 units</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                className="rounded border-[#E8E4DC] text-[#9E6B73] focus:ring-[#9E6B73]"
              />
              <span className="text-[#1A1A1A]">Auto-run all batches</span>
            </label>
            <span className="text-xs text-[#9B9B9B]">
              {autoRun ? 'Will process ALL ready products' : 'Will process one batch at a time'}
            </span>
          </div>

          <div className="flex items-start gap-2.5 p-4 bg-amber-50/80 border border-amber-200/60 rounded-xl mb-5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Products will be created as <strong>active</strong> in Shopify with inventory.
              They will be visible to customers and available for purchase immediately.
              Prices are set competitively based on Google Shopping benchmarks.
            </p>
          </div>

          <button
            onClick={startBulkList}
            disabled={running}
            className="w-full h-12 bg-[#B76E79] text-white font-medium rounded-xl transition-colors hover:bg-[#A25D68] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing batch {batchCount + 1}... ({remaining} remaining)
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                {autoRun
                  ? `Launch All ${stats?.total_ready || '?'} Products`
                  : `Launch Next ${batchSize} Products`}
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {(allResults.length > 0 || allErrors.length > 0) && (
          <div className="rounded-2xl border border-[#E8E4DC] bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-light text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#B76E79]" />
              Results
              <span className="ml-auto text-xs font-mono text-[#9B9B9B]">
                {allResults.length} listed &middot; {allErrors.length} failed
              </span>
            </h2>

            {allResults.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-green-700 mb-2">
                  Successfully Listed
                </h3>
                <div className="space-y-0 max-h-64 overflow-y-auto rounded-lg border border-green-100">
                  {allResults.map((r) => (
                    <div
                      key={r.product_hash}
                      className="flex items-center justify-between text-sm py-2.5 px-4 border-b border-green-50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-[#1A1A1A]">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#B76E79] font-medium font-mono text-xs">
                          EUR {r.price}
                        </span>
                        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
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
                <h3 className="text-xs font-medium uppercase tracking-wider text-red-700 mb-2">
                  Failed
                </h3>
                <div className="space-y-0 max-h-32 overflow-y-auto rounded-lg border border-red-100">
                  {allErrors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm py-2.5 px-4 border-b border-red-50 last:border-0">
                      <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[#1A1A1A]">{e.name}</span>
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
