"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  Terminal,
  CheckCircle,
  XCircle,
  Upload,
  FileJson,
  Tag,
  ShoppingBag,
  Rocket,
  AlertTriangle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ScraperStatus {
  status: string;
  anonymised: { exists: boolean; count: number; last_modified: string | null };
  staging: { exists: boolean; count: number };
  by_category: Record<string, number>;
}

interface StagingProduct {
  product_hash?: string;
  name_original: string;
  brand?: string;
  category?: string;
  price_original?: number;
  image_url?: string;
  description?: string;
  rating?: number | null;
  review_count?: number | null;
  in_stock?: boolean;
}

interface PushResult {
  name: string;
  shopify_id: string;
  price: string;
  status: string;
}

interface PushResponse {
  pushed: number;
  failed: number;
  remaining: number;
  markup_applied: number;
  results: PushResult[];
  errors?: { name: string; error: string }[];
  error?: string;
}

type LogEntry = { time: string; level: "info" | "success" | "error" | "warning"; message: string };

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AliExpressScraperPage() {
  // Tab: "scrape" | "push"
  const [tab, setTab] = useState<"scrape" | "push">("scrape");

  // Scrape tab state
  const [scraperStatus, setScraperStatus] = useState<ScraperStatus | null>(null);
  const [brandInput, setBrandInput] = useState("");

  // Push tab state
  const [stagingJson, setStagingJson] = useState("");
  const [parsedProducts, setParsedProducts] = useState<StagingProduct[]>([]);
  const [markup, setMarkup] = useState(2.5);
  const [minPrice, setMinPrice] = useState(9.99);
  const [pushStatus, setPushStatus] = useState<"active" | "draft">("draft");
  const [inventory, setInventory] = useState(50);
  const [batchSize, setBatchSize] = useState(10);
  const [pushOffset, setPushOffset] = useState(0);
  const [allPushResults, setAllPushResults] = useState<PushResult[]>([]);
  const [allPushErrors, setAllPushErrors] = useState<{ name: string; error: string }[]>([]);

  // Shared state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addLog = useCallback((level: LogEntry["level"], message: string) => {
    setLogs((prev) => [...prev, { time: new Date().toLocaleTimeString(), level, message }]);
  }, []);

  // ── Scrape tab actions ────────────────────────────────────────────────────

  const checkStatus = async () => {
    setLoading("status");
    addLog("info", "Checking scraper output files...");
    try {
      const res = await fetch("/api/admin/scrape-aliexpress");
      const data: ScraperStatus = await res.json();
      setScraperStatus(data);
      if (data.anonymised.exists) {
        addLog("success", `Found ${data.anonymised.count} anonymised + ${data.staging.count} staging products`);
      } else {
        addLog("warning", "No output yet — run the scraper first.");
      }
    } catch (e) {
      addLog("error", `Status check failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const copyCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    addLog("info", `Copied: ${cmd}`);
  };

  // ── Push tab actions ──────────────────────────────────────────────────────

  const parseJson = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const arr: StagingProduct[] = Array.isArray(parsed) ? parsed : parsed.products || [];
      setParsedProducts(arr);
      setPushOffset(0);
      setAllPushResults([]);
      setAllPushErrors([]);
      addLog("success", `Parsed ${arr.length} products — ready to push`);
    } catch {
      addLog("error", "Invalid JSON — paste the contents of aliexpress_intelligence_staging.json");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setStagingJson(text);
      parseJson(text);
    };
    reader.readAsText(file);
  };

  const pushBatch = async () => {
    if (parsedProducts.length === 0) {
      addLog("warning", "Paste or upload the staging JSON first.");
      return;
    }
    setLoading("push");
    const batch = parsedProducts.slice(pushOffset, pushOffset + batchSize);
    addLog("info", `Pushing ${batch.length} products to Shopify (batch starting at #${pushOffset + 1})...`);

    try {
      const res = await fetch("/api/admin/scrape-aliexpress/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: batch,
          markup,
          min_price: minPrice,
          status: pushStatus,
          inventory,
          batch_size: batchSize,
        }),
      });
      const data: PushResponse = await res.json();

      if (data.error) {
        addLog("error", data.error);
      } else {
        setAllPushResults((prev) => [...prev, ...(data.results || [])]);
        setAllPushErrors((prev) => [...prev, ...(data.errors || [])]);
        setPushOffset((prev) => prev + batchSize);
        addLog(
          "success",
          `Batch done: ${data.pushed} pushed, ${data.failed} failed. ${data.remaining} products remaining.`
        );
      }
    } catch (e) {
      addLog("error", `Push failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const logColor = (level: LogEntry["level"]) => {
    if (level === "success") return "text-emerald-700";
    if (level === "error") return "text-red-700";
    if (level === "warning") return "text-amber-700";
    return "text-[#6B5B4F]";
  };

  const remainingProducts = Math.max(0, parsedProducts.length - pushOffset);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#E8E4DC]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DC] text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
                Scraper / AliExpress
              </p>
              <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
                AliExpress → Shopify
              </h1>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 rounded-full border border-[#E8E4DC] bg-[#F5F3EE] p-1">
            <button
              onClick={() => setTab("scrape")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === "scrape"
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-[#6B5B4F] hover:text-[#9E6B73]"
              }`}
            >
              1. Scrape
            </button>
            <button
              onClick={() => setTab("push")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                tab === "push"
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-[#6B5B4F] hover:text-[#9E6B73]"
              }`}
            >
              2. Push to Shopify
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* ── SCRAPE TAB ─────────────────────────────────────────────────── */}
        {tab === "scrape" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: commands */}
            <div className="flex flex-col gap-6">

              {/* Brand builder */}
              <section className="rounded-2xl border border-[#9E6B73]/30 bg-[#9E6B73]/5 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-[#9E6B73]" />
                  <h2 className="text-lg font-medium text-[#1A1A1A]">Scrape by Brand</h2>
                </div>
                <input
                  type="text"
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder="e.g. Makartt, Beetles, Modelones, UR SUGAR"
                  className="w-full rounded-xl border border-[#E8E4DC] bg-white px-4 py-3 text-sm text-[#1A1A1A] placeholder-[#CCCCCC] focus:border-[#9E6B73] focus:outline-none"
                />
                {brandInput.trim() && (
                  <div className="mt-4 flex flex-col gap-2">
                    {[
                      {
                        label: "All products from brand(s)",
                        cmd: `python scrapers/aliexpress/scraper_api.py --brand "${brandInput.trim()}" --pages 2`,
                      },
                      {
                        label: "Brand × nail gel",
                        cmd: `python scrapers/aliexpress/scraper_api.py --brand "${brandInput.trim()}" --category nail_gel --pages 2`,
                      },
                    ].map(({ label, cmd }) => (
                      <div key={label} className="rounded-xl border border-[#E8E4DC] bg-white p-3">
                        <p className="mb-1 text-xs font-medium text-[#999999]">{label}</p>
                        <div className="flex items-start gap-2">
                          <code className="flex-1 break-all text-xs text-[#1A1A1A]">{cmd}</code>
                          <button
                            onClick={() => copyCmd(cmd)}
                            className="shrink-0 rounded border border-[#E8E4DC] px-2 py-0.5 text-xs text-[#6B5B4F] hover:border-[#9E6B73] hover:text-[#9E6B73]"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Category commands */}
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-[#9E6B73]" />
                  <h2 className="text-lg font-medium text-[#1A1A1A]">Scrape by Category</h2>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "All nail categories", cmd: "python scrapers/aliexpress/scraper_api.py --pages 2" },
                    { label: "Nail gel only", cmd: "python scrapers/aliexpress/scraper_api.py --pages 2 --category nail_gel" },
                    { label: "Nail polish only", cmd: "python scrapers/aliexpress/scraper_api.py --pages 2 --category nail_polish" },
                    { label: "Via run_all", cmd: "python scrapers/run_all.py --sources aliexpress --pages 2" },
                  ].map(({ label, cmd }) => (
                    <div key={label} className="rounded-xl bg-[#F5F3EE] p-3">
                      <p className="mb-1 text-xs font-medium text-[#999999]">{label}</p>
                      <div className="flex items-start gap-2">
                        <code className="flex-1 break-all text-xs text-[#1A1A1A]">{cmd}</code>
                        <button
                          onClick={() => copyCmd(cmd)}
                          className="shrink-0 rounded border border-[#E8E4DC] px-2 py-0.5 text-xs text-[#6B5B4F] hover:border-[#9E6B73] hover:text-[#9E6B73]"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-[#999999]">
                  Output goes to{" "}
                  <code className="rounded bg-[#F0EDE8] px-1 py-0.5">data/aliexpress_intelligence_staging.json</code>
                  {" "}— upload that file in the Push tab.
                </p>
              </section>
            </div>

            {/* Right: status */}
            <div className="flex flex-col gap-6">
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-[#1A1A1A]">Output Status</h2>
                  <button
                    onClick={checkStatus}
                    disabled={loading !== null}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium text-[#6B5B4F] hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
                  >
                    {loading === "status" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                    Check
                  </button>
                </div>
                {scraperStatus ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl border border-[#E8E4DC] p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          {scraperStatus.anonymised.exists ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <p className="text-xs text-[#999999]">Anonymised</p>
                        </div>
                        <p className="text-2xl font-semibold text-[#9E6B73]">{scraperStatus.anonymised.count}</p>
                      </div>
                      <div className="rounded-xl border border-[#E8E4DC] p-3">
                        <div className="mb-1 flex items-center gap-1.5">
                          {scraperStatus.staging.exists ? (
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <p className="text-xs text-[#999999]">Staging (for push)</p>
                        </div>
                        <p className="text-2xl font-semibold text-[#6B5B4F]">{scraperStatus.staging.count}</p>
                      </div>
                    </div>
                    {scraperStatus.anonymised.last_modified && (
                      <p className="mb-3 text-xs text-[#999999]">
                        Last scraped: {new Date(scraperStatus.anonymised.last_modified).toLocaleString()}
                      </p>
                    )}
                    {Object.keys(scraperStatus.by_category).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(scraperStatus.by_category).map(([cat, count]) => (
                          <span key={cat} className="rounded-full bg-[#F0EDE8] px-3 py-1 text-xs text-[#6B5B4F]">
                            {cat}: {count}
                          </span>
                        ))}
                      </div>
                    )}
                    {scraperStatus.staging.exists && scraperStatus.staging.count > 0 && (
                      <button
                        onClick={() => setTab("push")}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9E6B73] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8A5A62]"
                      >
                        <Rocket className="h-4 w-4" />
                        Push {scraperStatus.staging.count} products to Shopify →
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#CCCCCC]">
                    Click Check to see scraper output files.
                  </p>
                )}
              </section>

              {/* Category reference */}
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">Available Categories</h2>
                <div className="flex flex-col gap-2">
                  {[
                    { key: "nail_gel", label: "Nail Gel", desc: "UV gel, builder gel, soak-off" },
                    { key: "nail_polish", label: "Nail Polish", desc: "Gel polish, LED lamp polish" },
                    { key: "nail_art", label: "Nail Art", desc: "Decorations, glitter, stamping" },
                    { key: "nail_tools", label: "Nail Tools", desc: "Drills, lamps, brushes" },
                    { key: "skincare_serums", label: "Serums", desc: "Vitamin C, niacinamide" },
                    { key: "skincare_moisturizers", label: "Moisturizers", desc: "Face creams" },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between rounded-xl border border-[#E8E4DC] p-3">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">{label}</p>
                        <p className="text-xs text-[#999999]">{desc}</p>
                      </div>
                      <code className="text-xs text-[#9E6B73]">--category {key}</code>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ── PUSH TAB ───────────────────────────────────────────────────── */}
        {tab === "push" && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: JSON input */}
            <div className="flex flex-col gap-6">

              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#9E6B73]" />
                    <h2 className="text-lg font-medium text-[#1A1A1A]">Load Scraped Products</h2>
                  </div>
                  <label className="cursor-pointer rounded-full border border-[#E8E4DC] px-3 py-1.5 text-xs font-medium text-[#6B5B4F] hover:border-[#9E6B73] hover:text-[#9E6B73]">
                    <span className="inline-flex items-center gap-1">
                      <FileJson className="h-3 w-3" />
                      Upload File
                    </span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="sr-only" />
                  </label>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-[#999999]">
                  Upload or paste{" "}
                  <code className="rounded bg-[#F0EDE8] px-1 py-0.5">data/aliexpress_intelligence_staging.json</code>
                  {" "}(the file with full product data including images and prices).
                </p>
                <textarea
                  value={stagingJson}
                  onChange={(e) => setStagingJson(e.target.value)}
                  placeholder='[{"name_original": "UV Nail Gel Kit", "brand": "Makartt", "price_original": 5.99, ...}]'
                  className="h-40 w-full resize-y rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-4 font-mono text-xs text-[#1A1A1A] placeholder-[#CCCCCC] focus:border-[#9E6B73] focus:outline-none"
                />
                <button
                  onClick={() => parseJson(stagingJson)}
                  disabled={!stagingJson.trim()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#9E6B73] px-5 py-2.5 text-sm font-medium text-[#9E6B73] hover:bg-[#9E6B73] hover:text-white disabled:opacity-50"
                >
                  Parse JSON ({parsedProducts.length > 0 ? `${parsedProducts.length} loaded` : "not yet parsed"})
                </button>
              </section>

              {/* Pricing preview */}
              {parsedProducts.length > 0 && (
                <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                  <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">Preview (first 5)</h2>
                  <div className="flex flex-col gap-2 mb-4">
                    {parsedProducts.slice(0, 5).map((p, i) => {
                      const aliPrice = p.price_original ?? 0;
                      const shopifyPrice = aliPrice > 0
                        ? Math.max(aliPrice * markup, minPrice)
                        : minPrice;
                      return (
                        <div key={i} className="rounded-xl border border-[#E8E4DC] p-3">
                          <p className="truncate text-sm font-medium text-[#1A1A1A]">{p.name_original}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-[#999999]">{p.brand || "No brand"} · {p.category || "—"}</p>
                            <p className="text-xs font-medium text-[#9E6B73]">
                              €{aliPrice.toFixed(2)} → €{(Math.ceil(shopifyPrice) - 0.01).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {parsedProducts.length > 5 && (
                      <p className="text-center text-xs text-[#999999]">+ {parsedProducts.length - 5} more</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Right: settings + push button */}
            <div className="flex flex-col gap-6">

              {/* Push settings */}
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">Shopify Push Settings</h2>

                <div className="flex flex-col gap-4 mb-5">
                  {/* Markup */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6B5B4F]">
                      Price markup — {markup}×
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={0.1}
                      value={markup}
                      onChange={(e) => setMarkup(Number(e.target.value))}
                      className="w-full accent-[#9E6B73]"
                    />
                    <div className="mt-1 flex justify-between text-xs text-[#999999]">
                      <span>1× (cost)</span>
                      <span>2.5× (recommended)</span>
                      <span>5× (luxury)</span>
                    </div>
                    <p className="mt-1.5 text-xs text-[#999999]">
                      AliExpress price × {markup} = Shopify price. E.g. €5 → €{(Math.ceil(5 * markup) - 0.01).toFixed(2)}.
                    </p>
                  </div>

                  {/* Min price */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6B5B4F]">
                      Minimum price (EUR)
                    </label>
                    <select
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
                    >
                      <option value={4.99}>€4.99</option>
                      <option value={7.99}>€7.99</option>
                      <option value={9.99}>€9.99 (recommended)</option>
                      <option value={14.99}>€14.99</option>
                      <option value={19.99}>€19.99</option>
                    </select>
                  </div>

                  {/* Status + inventory */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6B5B4F]">
                        Status
                      </label>
                      <select
                        value={pushStatus}
                        onChange={(e) => setPushStatus(e.target.value as "active" | "draft")}
                        className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
                      >
                        <option value="draft">Draft (safe)</option>
                        <option value="active">Active (live)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6B5B4F]">
                        Inventory
                      </label>
                      <select
                        value={inventory}
                        onChange={(e) => setInventory(Number(e.target.value))}
                        className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
                      >
                        <option value={10}>10 units</option>
                        <option value={25}>25 units</option>
                        <option value={50}>50 units</option>
                        <option value={100}>100 units</option>
                      </select>
                    </div>
                  </div>

                  {/* Batch size */}
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#6B5B4F]">
                      Products per batch
                    </label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm text-[#1A1A1A] focus:border-[#9E6B73] focus:outline-none"
                    >
                      <option value={5}>5 (safe test)</option>
                      <option value={10}>10 (recommended)</option>
                      <option value={25}>25 (max)</option>
                    </select>
                  </div>
                </div>

                {pushStatus === "active" && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      Products will go <strong>live immediately</strong> and be visible to customers.
                    </p>
                  </div>
                )}

                <button
                  onClick={pushBatch}
                  disabled={loading !== null || parsedProducts.length === 0}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9E6B73] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#8A5A62] disabled:opacity-50"
                >
                  {loading === "push" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {parsedProducts.length === 0
                    ? "Load products first"
                    : remainingProducts > 0
                    ? `Push next ${Math.min(batchSize, remainingProducts)} / ${parsedProducts.length} products`
                    : "All batches pushed ✓"}
                </button>

                {parsedProducts.length > 0 && (
                  <div className="mt-3 h-1.5 w-full rounded-full bg-[#F0EDE8]">
                    <div
                      className="h-1.5 rounded-full bg-[#9E6B73] transition-all"
                      style={{ width: `${Math.min(100, (pushOffset / parsedProducts.length) * 100)}%` }}
                    />
                  </div>
                )}
              </section>

              {/* Push results */}
              {(allPushResults.length > 0 || allPushErrors.length > 0) && (
                <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                  <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                    Results
                    <span className="ml-2 text-xs font-mono font-normal text-[#999999]">
                      {allPushResults.length} pushed · {allPushErrors.length} failed
                    </span>
                  </h2>
                  {allPushResults.length > 0 && (
                    <div className="mb-4 max-h-52 overflow-y-auto rounded-xl border border-emerald-100">
                      {allPushResults.map((r, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-50 last:border-0 text-sm">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="truncate text-[#1A1A1A]">{r.name}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="font-mono text-xs text-[#9E6B73]">€{r.price}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-[#F0EDE8] text-[#6B5B4F]"}`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {allPushErrors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto rounded-xl border border-red-100">
                      {allPushErrors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 px-4 py-2.5 border-b border-red-50 last:border-0 text-sm">
                          <XCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                          <div>
                            <p className="text-[#1A1A1A]">{e.name}</p>
                            <p className="text-xs text-red-600">{e.error}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        )}

        {/* Activity log (always visible) */}
        <section className="mt-8 rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-medium text-[#1A1A1A]">Activity Log</h2>
            {logs.length > 0 && (
              <button onClick={() => setLogs([])} className="text-xs text-[#999999] hover:text-[#9E6B73]">
                Clear
              </button>
            )}
          </div>
          <div className="max-h-40 overflow-y-auto rounded-xl bg-[#F5F3EE] p-4">
            {logs.length === 0 ? (
              <p className="text-center text-xs text-[#CCCCCC]">No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {logs.map((log, i) => (
                  <p key={i} className="text-xs font-mono">
                    <span className="text-[#999999]">[{log.time}]</span>{" "}
                    <span className={logColor(log.level)}>{log.message}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
