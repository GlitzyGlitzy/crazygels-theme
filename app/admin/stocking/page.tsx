"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Search,
  ChevronDown,
  AlertCircle,
  Truck,
  DollarSign,
  Star,
  ArrowUpDown,
  X,
  Download,
} from "lucide-react";

/* ── Types ── */

interface StockingDecision {
  id: number;
  product_hash: string;
  decision: string;
  retail_price: number | null;
  initial_quantity: number | null;
  fulfillment_method: string;
  priority: string;
  notes: string | null;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
  review_signals: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: string;
  stock_count: string;
  pending_count: string;
  watchlist_count: string;
  reject_count: string;
  high_priority: string;
}

interface UnstockedProduct {
  product_hash: string;
  display_name: string;
  category: string;
  price_tier: string;
  efficacy_score: number | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  status: string;
  demand_tier: string;
  has_source: boolean;
}

/* ── Sub-components ── */

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

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    urgent: "bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20",
    high: "bg-[#B76E79]/10 text-[#B76E79] border-[#B76E79]/20",
    medium: "bg-[#C4963C]/10 text-[#C4963C] border-[#C4963C]/20",
    low: "bg-[#E8E4DC] text-[#6B5B4F] border-[#E8E4DC]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[priority] || styles.medium}`}
    >
      {priority}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const config: Record<string, { style: string; icon: React.ElementType }> = {
    stock: { style: "bg-[#4A7C59]/10 text-[#4A7C59]", icon: CheckCircle },
    pending: { style: "bg-[#C4963C]/10 text-[#C4963C]", icon: Clock },
    watchlist: { style: "bg-[#5B7E9E]/10 text-[#5B7E9E]", icon: Eye },
    reject: { style: "bg-[#9B9B9B]/10 text-[#9B9B9B]", icon: XCircle },
  };
  const { style, icon: DecIcon } = config[decision] || config.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${style}`}
    >
      <DecIcon className="h-3 w-3" />
      {decision}
    </span>
  );
}

/* ── Decision Modal ── */

function DecisionModal({
  product,
  existing,
  onSave,
  onClose,
  saving,
}: {
  product: { product_hash: string; display_name: string; category: string; price_tier: string; efficacy_score: number | null; key_actives: string[] | null; suitable_for: string[] | null };
  existing?: StockingDecision;
  onSave: (data: Record<string, unknown>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [decision, setDecision] = useState(existing?.decision || "stock");
  const [retailPrice, setRetailPrice] = useState(
    existing?.retail_price?.toString() || ""
  );
  const [quantity, setQuantity] = useState(
    existing?.initial_quantity?.toString() || "10"
  );
  const [fulfillment, setFulfillment] = useState(
    existing?.fulfillment_method || "in_house"
  );
  const [priority, setPriority] = useState(existing?.priority || "medium");
  const [notes, setNotes] = useState(existing?.notes || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#E8E4DC] p-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9E6B73]">
              Stocking Decision
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
              {product.display_name}
            </h3>
            <p className="mt-0.5 text-xs text-[#9B9B9B]">
              {product.category} &middot; {product.price_tier}
              {product.efficacy_score != null &&
                ` · ${Math.round(product.efficacy_score * 100)}% efficacy`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9B9B9B] transition-colors hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Decision */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
              Decision
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["stock", "pending", "watchlist", "reject"] as const).map(
                (d) => (
                  <button
                    key={d}
                    onClick={() => setDecision(d)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                      decision === d
                        ? "border-[#9E6B73] bg-[#9E6B73]/10 text-[#9E6B73]"
                        : "border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]/40"
                    }`}
                  >
                    {d}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Price + Quantity row */}
          {decision === "stock" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Retail Price (EUR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(e.target.value)}
                  placeholder="29.99"
                  className="h-10 w-full rounded-lg border border-[#E8E4DC] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Initial Qty
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  className="h-10 w-full rounded-lg border border-[#E8E4DC] bg-white px-3 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Fulfillment */}
          {decision === "stock" && (
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Fulfillment
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ["in_house", "In-House"],
                    ["dropship", "Dropship"],
                    ["hybrid", "Hybrid"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFulfillment(key)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      fulfillment === key
                        ? "border-[#9E6B73] bg-[#9E6B73]/10 text-[#9E6B73]"
                        : "border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
              Priority
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["urgent", "high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    priority === p
                      ? "border-[#9E6B73] bg-[#9E6B73]/10 text-[#9E6B73]"
                      : "border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]/40"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Supplier notes, pricing rationale..."
              className="w-full rounded-lg border border-[#E8E4DC] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
            />
          </div>

          {/* Key actives */}
          {product.key_actives && product.key_actives.length > 0 && (
            <div className="rounded-lg bg-[#F5F3EF] p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                Key Actives
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {product.key_actives.map((a) => (
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

          {/* Save */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full border border-[#E8E4DC] py-2.5 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73]"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                onSave({
                  product_hash: product.product_hash,
                  decision,
                  retail_price: retailPrice ? parseFloat(retailPrice) : null,
                  initial_quantity: quantity ? parseInt(quantity) : null,
                  fulfillment_method: fulfillment,
                  priority,
                  notes: notes || null,
                })
              }
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#1A1A1A] py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#9E6B73] disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {"Saving..."}
                </>
              ) : (
                "Save Decision"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ── */

export default function StockingPage() {
  const [decisions, setDecisions] = useState<StockingDecision[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // For adding new products from intelligence
  const [unstocked, setUnstocked] = useState<UnstockedProduct[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  // Modal state
  const [editingProduct, setEditingProduct] = useState<Record<string, unknown> | null>(null);
  const [editingExisting, setEditingExisting] = useState<StockingDecision | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cg_admin_token") || "";
    setAdminToken(stored);
    setTokenReady(true);
  }, []);

  const fetchDecisions = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/stocking?decision=${filter}&limit=200`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      setDecisions(data.decisions);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filter, adminToken]);

  const fetchUnstocked = useCallback(async () => {
    if (!adminToken) return;
    try {
      // Fetch research + sampled products not yet in stocking_decisions
      const res = await fetch(
        `/api/admin/demand-signals?status=research&sort=efficacy&limit=2000`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      if (!res.ok) return;
      const data = await res.json();
      // Also fetch sampled
      const res2 = await fetch(
        `/api/admin/demand-signals?status=sampled&sort=efficacy&limit=2000`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const data2 = res2.ok ? await res2.json() : { signals: [] };

      const allSignals = [...data.signals, ...data2.signals];
      const stockedHashes = new Set(
        decisions.map((d) => d.product_hash)
      );
      setUnstocked(
        allSignals.filter(
          (s: UnstockedProduct) => !stockedHashes.has(s.product_hash)
        )
      );
    } catch {
      /* silently fail */
    }
  }, [adminToken, decisions]);

  useEffect(() => {
    if (!tokenReady) return;
    if (adminToken) fetchDecisions();
    else setLoading(false);
  }, [fetchDecisions, adminToken, tokenReady]);

  useEffect(() => {
    if (showAdd && adminToken) fetchUnstocked();
  }, [showAdd, adminToken, fetchUnstocked]);

  const handleSave = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/stocking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        console.error("[v0] Save failed - status:", res.status, "body:", errorBody);
        alert(`Save failed (${res.status}): ${errorBody.error || "Unknown error"}`);
        return;
      }
      setEditingProduct(null);
      setEditingExisting(undefined);
      fetchDecisions();
    } catch (err) {
      console.error("[v0] Save failed:", err);
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  const filtered = decisions.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.display_name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      (d.key_actives || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  const filteredUnstocked = unstocked.filter((p) => {
    if (!addSearch) return true;
    const q = addSearch.toLowerCase();
    return (
      p.display_name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const toggleBulkSelect = (hash: string) => {
    setBulkSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visible = filteredUnstocked.slice(0, 200);
    const allSelected = visible.every((p) => bulkSelected.has(p.product_hash));
    if (allSelected) {
      setBulkSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((p) => next.delete(p.product_hash));
        return next;
      });
    } else {
      setBulkSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((p) => next.add(p.product_hash));
        return next;
      });
    }
  };

  const handleBulkAdd = async () => {
    if (bulkSelected.size === 0) return;
    setBulkSaving(true);
    let success = 0;
    let failed = 0;
    const selectedProducts = unstocked.filter((p) =>
      bulkSelected.has(p.product_hash)
    );
    for (const p of selectedProducts) {
      try {
        const res = await fetch("/api/admin/stocking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            product_hash: p.product_hash,
            decision: "stock",
            initial_quantity: 10,
            fulfillment_method: "in_house",
            priority: "medium",
          }),
        });
        if (res.ok) success++;
        else failed++;
      } catch {
        failed++;
      }
    }
    setBulkSaving(false);
    setBulkSelected(new Set());
    setShowAdd(false);
    fetchDecisions();
    alert(`Bulk add complete: ${success} added, ${failed} failed`);
  };

  /* Auth gate */
  if (!tokenReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8E4DC] border-t-[#9E6B73]" />
      </div>
    );
  }

  if (!adminToken) {
    return <AdminTokenGate onLogin={(t) => { localStorage.setItem("cg_admin_token", t); setAdminToken(t); }} />;
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#E8E4DC] bg-[#FAFAF8]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
              Internal
            </p>
            <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
              Stocking Decisions
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
  onClick={async () => {
    try {
      const res = await fetch("/api/admin/stocking/export-csv", {
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Export failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      a.download = match?.[1] || `crazygels-stocked-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }}
  className="inline-flex items-center gap-1.5 rounded-full border border-[#4A7C59] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#4A7C59] transition-colors hover:bg-[#4A7C59] hover:text-white"
  >
  <Download className="h-3.5 w-3.5" />
  Export CSV
  </button>
  <button
  onClick={() => setShowAdd(true)}
  className="rounded-full bg-[#1A1A1A] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#9E6B73]"
  >
  + Add Product
  </button>
  </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total" value={stats.total} icon={Package} accent="#9E6B73" />
            <StatCard label="Stock" value={stats.stock_count} icon={CheckCircle} accent="#4A7C59" />
            <StatCard label="Pending" value={stats.pending_count} icon={Clock} accent="#C4963C" />
            <StatCard label="Watchlist" value={stats.watchlist_count} icon={Eye} accent="#5B7E9E" />
            <StatCard label="Rejected" value={stats.reject_count} icon={XCircle} accent="#9B9B9B" />
            <StatCard label="High Priority" value={stats.high_priority} icon={AlertCircle} accent="#DC2626" />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {["all", "stock", "pending", "watchlist", "reject"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[#1A1A1A] text-white"
                    : "bg-[#F5F3EF] text-[#6B5B4F] hover:bg-[#E8E4DC]"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9B9B]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full rounded-full border border-[#E8E4DC] bg-white pl-9 pr-4 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none sm:w-64"
            />
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E8E4DC] border-t-[#9E6B73]" />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-[#B76E79]/20 bg-[#B76E79]/5 p-6 text-center text-sm text-[#B76E79]">
            {error}
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl border border-[#E8E4DC]">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#E8E4DC] bg-[#F5F3EF]">
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Product
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Decision
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Price
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Fulfillment
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Efficacy
                  </th>
                  <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr
                    key={d.product_hash}
                    className="border-b border-[#E8E4DC]/60 transition-colors hover:bg-[#F5F3EF]/60"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#1A1A1A]">
                        {d.display_name}
                      </p>
                      <p className="text-[10px] text-[#9B9B9B]">
                        {d.category} &middot; {d.price_tier}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <DecisionBadge decision={d.decision} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={d.priority} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                      {d.retail_price
                        ? `${d.retail_price.toFixed(2)} EUR`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#1A1A1A]">
                      {d.initial_quantity ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize text-[#6B5B4F]">
                        {d.fulfillment_method?.replace("_", " ") || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1A1A1A]">
                      {d.efficacy_score != null
                        ? `${Math.round(d.efficacy_score * 100)}%`
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setEditingProduct({
                            product_hash: d.product_hash,
                            display_name: d.display_name,
                            category: d.category,
                            price_tier: d.price_tier,
                            efficacy_score: d.efficacy_score,
                            key_actives: d.key_actives,
                            suitable_for: d.suitable_for,
                          });
                          setEditingExisting(d);
                        }}
                        className="rounded-lg border border-[#E8E4DC] px-3 py-1.5 text-xs font-medium text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-sm text-[#9B9B9B]"
                    >
                      No stocking decisions found. Click &quot;+ Add Product&quot; to
                      start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-[10px] uppercase tracking-wider text-[#9B9B9B]">
          Showing {filtered.length} of {decisions.length} decisions
        </p>
      </main>

      {/* Add Product Drawer */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-[#1A1A1A]/40 backdrop-blur-sm">
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-[#E8E4DC] bg-[#FAFAF8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E8E4DC] p-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9E6B73]">
                  Add from Intelligence
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                  Select Products to Stock
                </h3>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="rounded-lg p-1.5 text-[#9B9B9B] transition-colors hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9B9B9B]" />
                <input
                  type="text"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search intelligence products..."
                  className="h-9 w-full rounded-full border border-[#E8E4DC] bg-white pl-9 pr-4 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
                />
              </div>

              {/* Bulk actions bar */}
              <div className="mb-3 flex items-center justify-between rounded-lg border border-[#E8E4DC] bg-white px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[#6B5B4F]">
                  <input
                    type="checkbox"
                    checked={
                      filteredUnstocked.slice(0, 200).length > 0 &&
                      filteredUnstocked.slice(0, 200).every((p) => bulkSelected.has(p.product_hash))
                    }
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-[#E8E4DC] accent-[#9E6B73]"
                  />
                  Select All ({filteredUnstocked.slice(0, 200).length})
                </label>
                {bulkSelected.size > 0 && (
                  <button
                    onClick={handleBulkAdd}
                    disabled={bulkSaving}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#4A7C59] px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#3d6b4a] disabled:opacity-50"
                  >
                    {bulkSaving ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Adding {bulkSelected.size}...
                      </>
                    ) : (
                      <>Add {bulkSelected.size} Selected</>
                    )}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {filteredUnstocked.slice(0, 200).map((p) => (
                  <div
                    key={p.product_hash}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 transition-colors ${
                      bulkSelected.has(p.product_hash)
                        ? "border-[#9E6B73]/60 bg-[#9E6B73]/5"
                        : "border-[#E8E4DC] bg-white hover:border-[#9E6B73]/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={bulkSelected.has(p.product_hash)}
                      onChange={() => toggleBulkSelect(p.product_hash)}
                      className="h-4 w-4 shrink-0 rounded border-[#E8E4DC] accent-[#9E6B73]"
                    />
                    <button
                      onClick={() => {
                        setEditingProduct({
                          product_hash: p.product_hash,
                          display_name: p.display_name,
                          category: p.category,
                          price_tier: p.price_tier,
                          efficacy_score: p.efficacy_score,
                          key_actives: p.key_actives,
                          suitable_for: p.suitable_for,
                        });
                        setEditingExisting(undefined);
                        setShowAdd(false);
                      }}
                      className="flex flex-1 items-center justify-between text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {p.display_name}
                        </p>
                        <p className="text-[10px] text-[#9B9B9B]">
                          {p.category} &middot; {p.price_tier} &middot;{" "}
                          {p.efficacy_score != null
                            ? `${Math.round(p.efficacy_score * 100)}%`
                            : "N/A"}{" "}
                          efficacy
                        </p>
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[#9E6B73]">
                        Details
                      </span>
                    </button>
                  </div>
                ))}
                {filteredUnstocked.length === 0 && (
                  <p className="py-8 text-center text-sm text-[#9B9B9B]">
                    All intelligence products already have stocking decisions.
                  </p>
                )}
                {filteredUnstocked.length > 200 && (
                  <p className="py-2 text-center text-[10px] text-[#9B9B9B]">
                    Showing 200 of {filteredUnstocked.length} &mdash; use search to narrow down
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      {editingProduct && (
        <DecisionModal
          product={editingProduct as { product_hash: string; display_name: string; category: string; price_tier: string; efficacy_score: number | null; key_actives: string[] | null; suitable_for: string[] | null }}
          existing={editingExisting}
          onSave={handleSave}
          onClose={() => {
            setEditingProduct(null);
            setEditingExisting(undefined);
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

/* ── Auth Gate ── */

function AdminTokenGate({ onLogin }: { onLogin: (token: string) => void }) {
  const [token, setToken] = useState("");
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
          Stocking Decisions
        </h2>
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
