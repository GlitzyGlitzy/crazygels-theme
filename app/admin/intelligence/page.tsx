"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart3,
  Search,
  ArrowUpDown,
  Eye,
  Package,
  TrendingUp,
  FlaskConical,
  ShoppingBag,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ExternalLink,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DemandSignal {
  product_hash: string;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number | null;
  review_signals: string;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
  status: string;
  demand_tier: string;
  acquisition_lead: string | null;
  has_source: boolean;
  source: string | null;
  image_url: string | null;
  retail_price: number | null;
  currency: string | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  with_source: number;
  high_demand: number;
  avg_efficacy: string | number;
  catalog_total: number;
  enriched_price: number;
  enriched_image: number;
  enriched_complete: number;
  listed_on_shopify: number;
}

interface SourceDetail {
  acquisition_lead: string;
  product_hash: string;
  supplier_contacts: Record<string, string>;
  wholesale_price: number | null;
  moq: number | null;
  lead_time_days: number | null;
  sample_ordered: boolean;
  sample_status: string | null;
  listed_on_shopify: boolean;
  display_name: string;
  category: string;
  price_tier: string;
  efficacy_score: number | null;
  key_actives: string[] | null;
  estimated_margin: number | null;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accent}18`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
          {label}
        </p>
        <p className="text-xl font-semibold text-[#1A1A1A]">{value}</p>
      </div>
    </div>
  );
}

function DemandBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    high: "bg-[#B76E79]/10 text-[#B76E79] border-[#B76E79]/20",
    medium: "bg-[#9E6B73]/10 text-[#9E6B73] border-[#9E6B73]/20",
    low: "bg-[#E8E4DC] text-[#6B5B4F] border-[#E8E4DC]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[tier] || styles.low}`}
    >
      {tier}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { style: string; icon: React.ElementType }> = {
    research: {
      style: "bg-[#F5F3EF] text-[#6B5B4F]",
      icon: FlaskConical,
    },
    sampled: {
      style: "bg-[#B76E79]/10 text-[#B76E79]",
      icon: Clock,
    },
    listed: {
      style: "bg-[#4A7C59]/10 text-[#4A7C59]",
      icon: CheckCircle,
    },
  };
  const { style, icon: StatusIcon } = config[status] || config.research;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${style}`}
    >
      <StatusIcon className="h-3 w-3" />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Source Detail Modal                                                 */
/* ------------------------------------------------------------------ */

function SourceModal({
  source,
  onClose,
}: {
  source: SourceDetail;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8E4DC] p-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9E6B73]">
              Source Intelligence
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
              {source.display_name}
            </h3>
            <p className="mt-0.5 text-xs text-[#9B9B9B]">
              {source.category} &middot; {source.price_tier}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9B9B9B] transition-colors hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-6">
          {/* Supplier contacts */}
          {source.supplier_contacts &&
            Object.keys(source.supplier_contacts).length > 0 && (
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Supplier Contacts
                </p>
                <div className="space-y-1.5">
                  {Object.entries(source.supplier_contacts).map(
                    ([key, val]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between rounded-lg bg-[#F5F3EF] px-3 py-2"
                      >
                        <span className="text-xs capitalize text-[#6B5B4F]">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-medium text-[#1A1A1A]">
                          {val}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Financial */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Wholesale
              </p>
              <p className="mt-1 text-base font-semibold text-[#1A1A1A]">
                {source.wholesale_price
                  ? `$${source.wholesale_price.toFixed(2)}`
                  : "Unknown"}
              </p>
            </div>
            <div className="rounded-lg bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Est. Margin
              </p>
              <p className="mt-1 text-base font-semibold text-[#1A1A1A]">
                {source.estimated_margin
                  ? `${source.estimated_margin}%`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-lg bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                MOQ
              </p>
              <p className="mt-1 text-base font-semibold text-[#1A1A1A]">
                {source.moq ?? "Unknown"}
              </p>
            </div>
            <div className="rounded-lg bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Lead Time
              </p>
              <p className="mt-1 text-base font-semibold text-[#1A1A1A]">
                {source.lead_time_days
                  ? `${source.lead_time_days} days`
                  : "Unknown"}
              </p>
            </div>
          </div>

          {/* Sample status */}
          <div className="flex items-center justify-between rounded-lg border border-[#E8E4DC] p-3">
            <span className="text-xs text-[#6B5B4F]">Sample Status</span>
            <span className="text-xs font-medium text-[#1A1A1A]">
              {source.sample_ordered
                ? source.sample_status || "Ordered"
                : "Not ordered"}
            </span>
          </div>

          {/* Actives */}
          {source.key_actives && source.key_actives.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Key Actives
              </p>
              <div className="flex flex-wrap gap-1.5">
                {source.key_actives.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-[#E8E4DC] bg-[#F5F3EF] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F]"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function IntelligenceDashboard() {
  const [signals, setSignals] = useState<DemandSignal[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("research");
  const [sortBy, setSortBy] = useState("efficacy");
  const [search, setSearch] = useState("");

  const [selectedSource, setSelectedSource] = useState<SourceDetail | null>(
    null
  );
  const [revealLoading, setRevealLoading] = useState<string | null>(null);

  // Shopify listing state
  const [listingProduct, setListingProduct] = useState<DemandSignal | null>(null);
  const [listingLoading, setListingLoading] = useState(false);
  const [listingResult, setListingResult] = useState<{ success: boolean; message: string; handle?: string } | null>(null);

  // Enrichment state
  const [enriching, setEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<{
    enriched: number; prices_set: number; images_found: number; total_remaining: number;
  } | null>(null);

  // Delay all rendering until after hydration to avoid GTM insertBefore errors
  const [mounted, setMounted] = useState(false);

  // Read token in useEffect to avoid hydration mismatch
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("cg_admin_token") || "";
    setAdminToken(stored);
    setTokenReady(true);
  }, []);

  const fetchSignals = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/demand-signals?status=${statusFilter}&sort=${sortBy}&limit=2000`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized -- set admin token");
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setSignals(data.signals);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy, adminToken]);

  useEffect(() => {
    if (!tokenReady) return;
    if (adminToken) fetchSignals();
    else setLoading(false);
  }, [fetchSignals, adminToken, tokenReady]);

  const handleReveal = async (acquisitionLead: string) => {
    setRevealLoading(acquisitionLead);
    try {
      const res = await fetch("/api/admin/reveal-source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ acquisition_lead: acquisitionLead }),
      });
      if (!res.ok) throw new Error("Failed to reveal source");
      const source = await res.json();
      setSelectedSource(source);
    } catch (err) {
      console.error("Reveal failed:", err);
    } finally {
      setRevealLoading(null);
    }
  };

  const handleListOnShopify = async (product: DemandSignal) => {
    setListingLoading(true);
    setListingResult(null);
    try {
      const res = await fetch("/api/admin/list-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({ product_hash: product.product_hash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to list product");
      setListingResult({
        success: true,
        message: `Listed as draft on Shopify at $${data.price}`,
        handle: data.handle,
      });
      // Refresh the list to show updated status
      fetchSignals();
    } catch (err) {
      setListingResult({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setListingLoading(false);
    }
  };

  const handleEnrichAll = async (priceOnly = false) => {
    setEnriching(true);
    setEnrichResult(null);
    try {
      const res = await fetch("/api/admin/enrich-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify({ batch_size: 200, price_only: priceOnly }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enrich");
      setEnrichResult(data);
      // Refresh the list to show updated data
      fetchSignals();
    } catch (err) {
      console.error("Enrich failed:", err);
    } finally {
      setEnriching(false);
    }
  };

  const filtered = signals.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.display_name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      (s.key_actives || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  /* ----- Wait for client mount + token check ----- */
  if (!mounted || !tokenReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8E4DC] border-t-[#9E6B73]" />
      </div>
    );
  }

  /* ----- Auth gate ----- */
  if (!adminToken) {
    return <AdminTokenGate onLogin={(t) => { localStorage.setItem("cg_admin_token", t); setAdminToken(t); }} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]" suppressHydrationWarning>
      {/* Header */}
      <header className="border-b border-[#E8E4DC] bg-[#FAFAF8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
              Internal
            </p>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
              Product Intelligence
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
            >
              All Tools
            </Link>
            <button
              onClick={fetchSignals}
              className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
            >
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats row */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard
              label="Total Products"
              value={stats.total}
              icon={Package}
              accent="#9E6B73"
            />
            <StatCard
              label="Enriched"
              value={`${stats.enriched_complete ?? 0}/${stats.catalog_total ?? 0}`}
              icon={ShoppingBag}
              accent="#6B5B4F"
            />
            <StatCard
              label="High Demand"
              value={stats.high_demand}
              icon={TrendingUp}
              accent="#B76E79"
            />
            <StatCard
              label="Avg Efficacy"
              value={`${Math.round(Number(stats.avg_efficacy) * 100)}%`}
              icon={BarChart3}
              accent="#4A7C59"
            />
          </div>
        )}

        {/* Enrichment Progress */}
        {stats && (stats.catalog_total ?? 0) > 0 && (stats.enriched_complete ?? 0) < (stats.catalog_total ?? 1) && (
          <div className="mb-6 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Catalog Enrichment
                </p>
                <p className="mt-1 text-sm text-[#1A1A1A]">
                  <span className="font-semibold">{stats.enriched_price ?? 0}</span> with prices,{" "}
                  <span className="font-semibold">{stats.enriched_image ?? 0}</span> with images,{" "}
                  <span className="font-semibold">{stats.listed_on_shopify ?? 0}</span> listed on Shopify
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEnrichAll(true)}
                  disabled={enriching}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E4DC] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
                >
                  {enriching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Set Prices
                </button>
                <button
                  onClick={() => handleEnrichAll(false)}
                  disabled={enriching}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#9E6B73] disabled:opacity-50"
                >
                  {enriching ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Enrich All
                </button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E8E4DC]">
              <div
                className="h-full rounded-full bg-[#9E6B73] transition-all"
                style={{ width: `${Math.round(((stats.enriched_complete ?? 0) / (stats.catalog_total || 1)) * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[#9B9B9B]">
              {Math.round(((stats.enriched_complete ?? 0) / (stats.catalog_total || 1)) * 100)}% complete
              {enrichResult && (
                <span className="ml-3 text-[#4A7C59]">
                  Last run: {enrichResult.enriched} enriched, {enrichResult.prices_set} prices set, {enrichResult.images_found} images found
                </span>
              )}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {["research", "sampled", "listed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? "bg-[#1A1A1A] text-[#FAFAF8]"
                    : "border border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-48 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] pl-9 pr-4 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 appearance-none rounded-full border border-[#E8E4DC] bg-[#FAFAF8] pl-4 pr-8 text-xs text-[#6B5B4F] focus:border-[#9E6B73] focus:outline-none"
              >
                <option value="efficacy">By Efficacy</option>
                <option value="recent">By Recent</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-[#9B9B9B]" />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#B76E79]/30 bg-[#B76E79]/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-[#B76E79]" />
            <p className="text-sm text-[#B76E79]">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8E4DC] border-t-[#9E6B73]" />
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-[#E8E4DC]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E4DC] bg-[#F5F3EF]">
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                    <button
                      onClick={() => setSortBy("efficacy")}
                      className="inline-flex items-center gap-1"
                    >
                      Efficacy <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B] md:table-cell">
                    Demand
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B] lg:table-cell">
                    Price
                  </th>
                  <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B] md:table-cell">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((signal) => (
                  <tr
                    key={signal.product_hash}
                    className="border-b border-[#E8E4DC] transition-colors last:border-0 hover:bg-[#F5F3EF]/60"
                  >
                    {/* Product */}
                    <td className="max-w-xs px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {signal.image_url ? (
                          <img
                            src={signal.image_url}
                            alt={signal.display_name}
                            className="h-10 w-10 shrink-0 rounded-lg border border-[#E8E4DC] object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]">
                            <Package className="h-4 w-4 text-[#9B9B9B]" />
                          </div>
                        )}
                        <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#1A1A1A]">
                        {signal.display_name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(signal.key_actives || []).slice(0, 2).map((a) => (
                          <span
                            key={a}
                            className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#6B5B4F]"
                          >
                            {a}
                          </span>
                        ))}
                        <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[9px] text-[#9B9B9B]">
                          {signal.category}
                        </span>
                      </div>
                        </div>
                      </div>
                    </td>

                    {/* Efficacy */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E8E4DC]">
                          <div
                            className="h-full rounded-full bg-[#9E6B73]"
                            style={{
                              width: `${Math.round((signal.efficacy_score || 0) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums text-[#666666]">
                          {Math.round((signal.efficacy_score || 0) * 100)}%
                        </span>
                      </div>
                    </td>

                    {/* Demand */}
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <DemandBadge tier={signal.demand_tier} />
                    </td>

                    {/* Price */}
                    <td className="hidden px-4 py-3.5 lg:table-cell">
                      {signal.retail_price && Number(signal.retail_price) > 0 ? (
                        <span className="text-sm font-medium tabular-nums text-[#1A1A1A]">
                          {Number(signal.retail_price).toFixed(2)} {signal.currency || "EUR"}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                          Not set
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="hidden px-4 py-3.5 md:table-cell">
                      <StatusPill status={signal.status} />
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {signal.status === "listed" ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#4A7C59]">
                            <CheckCircle className="h-3 w-3" />
                            Listed
                          </span>
                        ) : (
                          <button
                            onClick={() => setListingProduct(signal)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#9E6B73] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#9E6B73] transition-all hover:bg-[#9E6B73] hover:text-white"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            List on Shopify
                          </button>
                        )}
                        {signal.acquisition_lead && (
                          <button
                            onClick={() => handleReveal(signal.acquisition_lead!)}
                            disabled={revealLoading === signal.acquisition_lead}
                            className="inline-flex items-center gap-1 rounded-full border border-[#E8E4DC] px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
                            title="View source details"
                          >
                            {revealLoading === signal.acquisition_lead ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-sm text-[#9B9B9B]"
                    >
                      No products found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Result count */}
        {!loading && !error && (
          <p className="mt-4 text-[10px] uppercase tracking-wider text-[#9B9B9B]">
            Showing {filtered.length} of {signals.length} products
          </p>
        )}
      </main>

      {/* Source detail modal */}
      {selectedSource && (
        <SourceModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}

      {/* Shopify listing confirmation modal */}
      {listingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-md rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#E8E4DC] p-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9E6B73]">
                  List on Shopify
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                  {listingProduct.display_name}
                </h3>
                <p className="mt-0.5 text-xs text-[#9B9B9B]">
                  {listingProduct.category} &middot; {listingProduct.price_tier}
                </p>
              </div>
              <button
                onClick={() => { setListingProduct(null); setListingResult(null); }}
                className="rounded-lg p-1.5 text-[#9B9B9B] transition-colors hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {/* Product info */}
              <div className="rounded-lg bg-[#F5F3EF] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B5B4F]">Efficacy Score</span>
                  <span className="text-sm font-semibold text-[#1A1A1A]">
                    {Math.round((listingProduct.efficacy_score || 0) * 100)}%
                  </span>
                </div>
                {listingProduct.key_actives && listingProduct.key_actives.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                      Key Actives
                    </span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {listingProduct.key_actives.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-[#6B5B4F]"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Result message */}
              {listingResult && (
                <div
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    listingResult.success
                      ? "border-[#4A7C59]/30 bg-[#4A7C59]/5"
                      : "border-[#B76E79]/30 bg-[#B76E79]/5"
                  }`}
                >
                  {listingResult.success ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#4A7C59]" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B76E79]" />
                  )}
                  <div>
                    <p className={`text-sm ${listingResult.success ? "text-[#4A7C59]" : "text-[#B76E79]"}`}>
                      {listingResult.message}
                    </p>
                    {listingResult.handle && (
                      <a
                        href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || "crazygels.myshopify.com"}/admin/products`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-[#9E6B73] underline"
                      >
                        View in Shopify Admin <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!listingResult?.success && (
                <div className="flex gap-3">
                  <button
                    onClick={() => { setListingProduct(null); setListingResult(null); }}
                    className="flex-1 rounded-full border border-[#E8E4DC] py-2.5 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleListOnShopify(listingProduct)}
                    disabled={listingLoading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#9E6B73] disabled:opacity-50"
                  >
                    {listingLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Listing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3 w-3" />
                        List as Draft
                      </>
                    )}
                  </button>
                </div>
              )}

              {listingResult?.success && (
                <button
                  onClick={() => { setListingProduct(null); setListingResult(null); }}
                  className="w-full rounded-full bg-[#1A1A1A] py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#9E6B73]"
                >
                  Done
                </button>
              )}

              <p className="text-center text-[10px] text-[#9B9B9B]">
                Product will be created as a draft in Shopify. You can edit pricing and details before publishing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin Token Gate                                                    */
/* ------------------------------------------------------------------ */

function AdminTokenGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) {
      onLogin(token.trim());
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
      <form
        onSubmit={handleSubmit}
        className="mx-4 w-full max-w-sm rounded-2xl border border-[#E8E4DC] bg-white p-8 shadow-sm"
      >
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
          Internal Access
        </p>
        <h2 className="mt-1 font-serif text-xl font-light text-[#1A1A1A]">
          Product Intelligence
        </h2>
        <p className="mt-2 text-xs text-[#9B9B9B]">
          Enter your admin token to access the intelligence dashboard.
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
          className="mt-4 w-full rounded-full bg-[#1A1A1A] py-2.5 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:bg-[#9E6B73]"
        >
          Enter Dashboard
        </button>
      </form>
    </div>
  );
}
