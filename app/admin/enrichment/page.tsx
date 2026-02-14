"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Zap,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Loader2,
  Upload,
  DollarSign,
  Search,
  ChevronDown,
  Eye,
  FlaskConical,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface EnrichmentRow {
  id: number;
  shopify_product_id: string;
  shopify_title: string;
  shopify_vendor: string | null;
  shopify_product_type: string | null;
  shopify_price: number | null;
  shopify_handle: string | null;
  catalog_product_hash: string;
  catalog_display_name: string | null;
  match_method: string;
  similarity_score: number;
  confidence: string;
  match_reasons: string[] | null;
  efficacy_score: number | null;
  key_actives: string[] | null;
  suitable_for: string[] | null;
  contraindications: string[] | null;
  ingredient_summary: Record<string, number>;
  competitor_price_avg: number | null;
  price_position: string | null;
  margin_opportunity: number | null;
  status: string;
}

interface MatchRunResult {
  status: string;
  total_shopify: number;
  matched: number;
  high_confidence: number;
  match_rate: string;
  message?: string;
}

interface EnrichmentStats {
  total: number;
  avg_similarity: number;
  by_confidence: Array<{ confidence: string; count: string }>;
  by_status: Array<{ status: string; count: string }>;
  by_price_position: Array<{ price_position: string; count: string }>;
}

type LogEntry = {
  time: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: "bg-[#4A7C59]/10 text-[#4A7C59] border-[#4A7C59]/20",
    medium: "bg-[#C4963C]/10 text-[#C4963C] border-[#C4963C]/20",
    low: "bg-[#B76E79]/10 text-[#B76E79] border-[#B76E79]/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${styles[level] || styles.low}`}
    >
      {level}
    </span>
  );
}

function PricePositionBadge({ position }: { position: string | null }) {
  if (!position) return <span className="text-xs text-[#999999]">--</span>;
  const config: Record<string, { icon: typeof TrendingUp; style: string; label: string }> = {
    underpriced: { icon: TrendingUp, style: "text-[#4A7C59]", label: "Underpriced" },
    fair: { icon: Minus, style: "text-[#6B5B4F]", label: "Fair" },
    overpriced: { icon: TrendingDown, style: "text-[#B76E79]", label: "Overpriced" },
  };
  const { icon: Icon, style, label } = config[position] || config.fair;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${style}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function MethodPill({ method }: { method: string }) {
  const config: Record<string, { style: string; icon: typeof Sparkles }> = {
    exact: { style: "bg-[#4A7C59]/10 text-[#4A7C59]", icon: CheckCircle },
    fuzzy: { style: "bg-[#9E6B73]/10 text-[#9E6B73]", icon: Sparkles },
    ingredient: { style: "bg-[#C4963C]/10 text-[#C4963C]", icon: FlaskConical },
    manual: { style: "bg-[#5B7E9E]/10 text-[#5B7E9E]", icon: Eye },
  };
  const { style, icon: Icon } = config[method] || config.fuzzy;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style}`}
    >
      <Icon className="h-3 w-3" />
      {method}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Detail modal                                                       */
/* ------------------------------------------------------------------ */

function EnrichmentDetail({
  row,
  onClose,
  onStatusChange,
  onAdjustPrice,
}: {
  row: EnrichmentRow;
  onClose: () => void;
  onStatusChange: (id: number, status: string) => void;
  onAdjustPrice: (id: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1A1A]/40 backdrop-blur-sm">
      <div className="relative mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E8E4DC] p-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9E6B73]">
              Enrichment Match
            </p>
            <h3 className="mt-1 truncate text-lg font-semibold text-[#1A1A1A]">
              {row.shopify_title}
            </h3>
            <p className="mt-0.5 text-xs text-[#9B9B9B]">
              {row.shopify_vendor} &middot; {row.shopify_product_type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-[#9B9B9B] transition-colors hover:bg-[#E8E4DC] hover:text-[#1A1A1A]"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Match overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Similarity
              </p>
              <p className="mt-1 text-xl font-semibold text-[#1A1A1A]">
                {(row.similarity_score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Confidence
              </p>
              <div className="mt-1">
                <ConfidenceBadge level={row.confidence} />
              </div>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Method
              </p>
              <div className="mt-1">
                <MethodPill method={row.match_method} />
              </div>
            </div>
          </div>

          {/* Matched catalog product */}
          {row.catalog_display_name && (
            <div className="rounded-xl border border-[#E8E4DC] p-4">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Matched Catalog Product
              </p>
              <p className="text-sm font-medium text-[#1A1A1A]">
                {row.catalog_display_name}
              </p>
              <p className="mt-0.5 text-xs text-[#999999]">
                Hash: {row.catalog_product_hash}
              </p>
            </div>
          )}

          {/* Match reasons */}
          {row.match_reasons && row.match_reasons.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Match Signals
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.match_reasons.map((r, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-[#E8E4DC] bg-[#F5F3EF] px-2.5 py-0.5 font-mono text-[10px] text-[#6B5B4F]"
                  >
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Efficacy + Price analysis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Efficacy Score
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                {row.efficacy_score
                  ? `${row.efficacy_score}/5`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Your Price
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                {row.shopify_price
                  ? `EUR ${Number(row.shopify_price).toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Competitor Avg
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1A1A1A]">
                {row.competitor_price_avg
                  ? `EUR ${Number(row.competitor_price_avg).toFixed(2)}`
                  : "N/A"}
              </p>
            </div>
            <div className="rounded-xl bg-[#F5F3EF] p-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B]">
                Price Position
              </p>
              <div className="mt-1">
                <PricePositionBadge position={row.price_position} />
              </div>
            </div>
          </div>

          {/* Margin opportunity */}
          {row.margin_opportunity !== null && (
            <div
              className={`rounded-xl border p-4 ${
                row.margin_opportunity > 0
                  ? "border-[#4A7C59]/20 bg-[#4A7C59]/5"
                  : "border-[#B76E79]/20 bg-[#B76E79]/5"
              }`}
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Margin Opportunity
              </p>
              <p
                className={`mt-1 text-xl font-semibold ${
                  row.margin_opportunity > 0
                    ? "text-[#4A7C59]"
                    : "text-[#B76E79]"
                }`}
              >
                {row.margin_opportunity > 0 ? "+" : ""}
                EUR {Number(row.margin_opportunity).toFixed(2)}
              </p>
              <p className="mt-1 text-xs text-[#999999]">
                {row.margin_opportunity > 0
                  ? "Room to increase price based on competitor analysis"
                  : "Currently priced above competitor average"}
              </p>
            </div>
          )}

          {/* Key actives */}
          {row.key_actives && row.key_actives.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Key Actives
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.key_actives.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border border-[#E8E4DC] bg-[#F5F3EF] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F]"
                  >
                    {a.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suitable for */}
          {row.suitable_for && row.suitable_for.length > 0 && (
            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                Suitable For
              </p>
              <div className="flex flex-wrap gap-1.5">
                {row.suitable_for.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-[#9E6B73]/10 px-2.5 py-0.5 text-[10px] font-medium text-[#9E6B73]"
                  >
                    {s.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Price adjustment */}
          {row.price_position === "overpriced" &&
            row.competitor_price_avg != null &&
            row.shopify_price != null && (
              <div className="rounded-xl border border-[#C4963C]/30 bg-[#C4963C]/5 p-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C4963C]">
                  Price Adjustment Available
                </p>
                <p className="mt-1 text-sm text-[#6B5B4F]">
                  Your price:{" "}
                  <span className="font-semibold text-[#B76E79]">
                    EUR {Number(row.shopify_price).toFixed(2)}
                  </span>{" "}
                  &rarr; Benchmark:{" "}
                  <span className="font-semibold text-[#4A7C59]">
                    EUR {Number(row.competitor_price_avg).toFixed(2)}
                  </span>{" "}
                  <span className="text-xs text-[#9B9B9B]">
                    (save EUR{" "}
                    {(
                      Number(row.shopify_price) -
                      Number(row.competitor_price_avg)
                    ).toFixed(2)}
                    )
                  </span>
                </p>
                <button
                  onClick={() => onAdjustPrice(row.id)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#C4963C] px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#B38734]"
                >
                  <DollarSign className="h-3 w-3" />
                  Adjust to Benchmark Price
                </button>
              </div>
            )}

          {/* Action buttons */}
          <div className="flex gap-3 border-t border-[#E8E4DC] pt-5">
            <button
              onClick={() => onStatusChange(row.id, "approved")}
              className="flex-1 rounded-full bg-[#4A7C59] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#3D6A4A]"
            >
              Approve Match
            </button>
            <button
              onClick={() => onStatusChange(row.id, "rejected")}
              className="flex-1 rounded-full border border-[#E8E4DC] px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#B76E79] hover:text-[#B76E79]"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function EnrichmentDashboard() {
  const [enrichments, setEnrichments] = useState<EnrichmentRow[]>([]);
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [matchResult, setMatchResult] = useState<MatchRunResult | null>(null);
  const [selectedRow, setSelectedRow] = useState<EnrichmentRow | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("all");

  const addLog = useCallback(
    (level: LogEntry["level"], message: string) => {
      setLogs((prev) => [
        ...prev,
        { time: new Date().toLocaleTimeString(), level, message },
      ]);
    },
    []
  );

  const runAutoMatch = async () => {
    setLoading("match");
    addLog("info", "Starting auto-match: fetching Shopify products and matching against catalog...");
    try {
      const res = await fetch("/api/enrich-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "auto" }),
      });
      const data: MatchRunResult & { results?: unknown[] } = await res.json();
      setMatchResult(data);
      if (data.status === "success") {
        addLog(
          "success",
          `Match complete: ${data.matched}/${data.total_shopify} matched (${data.match_rate}), ${data.high_confidence} high confidence`
        );
        // Auto-load results
        await loadEnrichments();
      } else {
        addLog("error", `Match failed: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `Match error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const computeBenchmarks = async () => {
    setLoading("benchmark");
    addLog("info", "Computing market benchmarks from catalog data...");
    try {
      const res = await fetch("/api/enrich-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "benchmark" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        addLog("success", `Benchmarks computed for ${data.benchmarks_computed} segments`);
      } else {
        addLog("error", `Benchmark error: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `Benchmark error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const loadEnrichments = async () => {
    setLoading("load");
    addLog("info", "Loading enrichment results...");
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (confidenceFilter !== "all") params.set("confidence", confidenceFilter);
      const res = await fetch(`/api/enrich-products?${params}`);
      const data = await res.json();
      if (data.status === "success") {
        setEnrichments(data.enrichments || []);
        setStats({
          total: data.total,
          avg_similarity: data.avg_similarity,
          by_confidence: data.by_confidence,
          by_status: data.by_status,
          by_price_position: data.by_price_position,
        });
        addLog("success", `Loaded ${data.enrichments?.length || 0} enrichments (${data.total} total)`);
      } else {
        addLog("error", `Load error: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `Load error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      // Update locally first for instant UI feedback
      setEnrichments((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      setSelectedRow(null);

      // Persist to database
      const res = await fetch("/api/enrich-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_status", id, status: newStatus }),
      });
      if (!res.ok) {
        addLog("error", `Failed to persist status for #${id}`);
      } else {
        addLog("success", `Match #${id} ${newStatus}`);
      }
    } catch (e) {
      addLog("error", `Status update error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const bulkUpdateStatus = async (ids: number[], newStatus: string) => {
    try {
      const res = await fetch("/api/enrich-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_status", ids, status: newStatus }),
      });
      if (!res.ok) {
        addLog("error", `Failed to persist bulk ${newStatus}`);
      }
    } catch (e) {
      addLog("error", `Bulk persist error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleApproveAll = async () => {
    const pending = enrichments.filter(
      (e) => e.status !== "approved" && e.status !== "rejected"
    );
    if (pending.length === 0) {
      addLog("warning", "No pending matches to approve");
      return;
    }
    const confirmMsg = `Approve all ${pending.length} pending matches?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading("approve_all");
    addLog("info", `Approving ${pending.length} matches...`);

    const ids = pending.map((e) => e.id);
    setEnrichments((prev) =>
      prev.map((e) =>
        e.status !== "approved" && e.status !== "rejected"
          ? { ...e, status: "approved" }
          : e
      )
    );
    await bulkUpdateStatus(ids, "approved");
    addLog("success", `Approved ${pending.length} matches`);
    setLoading(null);
  };

  const handleRejectAll = async () => {
    const pending = enrichments.filter(
      (e) => e.status !== "approved" && e.status !== "rejected"
    );
    if (pending.length === 0) {
      addLog("warning", "No pending matches to reject");
      return;
    }
    const confirmMsg = `Reject all ${pending.length} pending matches?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading("reject_all");
    addLog("info", `Rejecting ${pending.length} matches...`);

    const ids = pending.map((e) => e.id);
    setEnrichments((prev) =>
      prev.map((e) =>
        e.status !== "approved" && e.status !== "rejected"
          ? { ...e, status: "rejected" }
          : e
      )
    );
    await bulkUpdateStatus(ids, "rejected");
    addLog("success", `Rejected ${pending.length} matches`);
    setLoading(null);
  };

  const handleApproveFiltered = async () => {
    const toApprove = filteredByConfidence.filter(
      (e) => e.status !== "approved" && e.status !== "rejected"
    );
    if (toApprove.length === 0) {
      addLog("warning", "No pending matches in current view");
      return;
    }
    const confirmMsg = `Approve ${toApprove.length} ${confidenceFilter === "all" ? "" : confidenceFilter + " confidence "}matches?`;
    if (!window.confirm(confirmMsg)) return;

    const ids = toApprove.map((e) => e.id);
    const idSet = new Set(ids);
    setEnrichments((prev) =>
      prev.map((e) => (idSet.has(e.id) ? { ...e, status: "approved" } : e))
    );
    await bulkUpdateStatus(ids, "approved");
    addLog("success", `Approved ${toApprove.length} matches`);
  };

  const handlePushToShopify = async () => {
    const approvedCount = enrichments.filter(
      (e) => e.status === "approved"
    ).length;
    if (approvedCount === 0) {
      addLog("warning", "No approved matches to push. Approve matches first.");
      return;
    }
    const confirmMsg = `Push ${approvedCount} approved enrichments to Shopify? This will add metafields (ingredients, efficacy, skin concerns) and enrichment tags to your live products.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading("push");
    addLog("info", `Pushing ${approvedCount} enrichments to Shopify...`);

    try {
      const res = await fetch("/api/enrich-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "push_to_shopify" }),
      });
      const data = await res.json();
      if (data.status === "success") {
        addLog(
          "success",
          `Pushed ${data.pushed} enrichments to Shopify (${data.failed} failed)`
        );
        if (data.pushed > 0) {
          // Update local state to reflect "applied" status
          setEnrichments((prev) =>
            prev.map((e) =>
              e.status === "approved" ? { ...e, status: "applied" } : e
            )
          );
        }
        if (data.errors?.length) {
          for (const err of data.errors.slice(0, 5)) {
            addLog("error", err);
          }
        }
      } else {
        addLog("error", `Push failed: ${data.message}`);
      }
    } catch (e) {
      addLog(
        "error",
        `Push error: ${e instanceof Error ? e.message : String(e)}`
      );
    }
    setLoading(null);
  };

  const handleAdjustPrice = async (id: number) => {
    const row = enrichments.find((e) => e.id === id);
    if (!row) return;
    const confirmMsg = `Adjust "${row.shopify_title}" from EUR ${Number(row.shopify_price).toFixed(2)} to EUR ${Number(row.competitor_price_avg).toFixed(2)}?`;
    if (!window.confirm(confirmMsg)) return;

    setLoading("price");
    addLog("info", `Adjusting price for ${row.shopify_title}...`);

    try {
      const res = await fetch("/api/enrich-products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust_prices",
          ids: [id],
          strategy: "match_avg",
        }),
      });
      const data = await res.json();
      if (data.status === "success" && data.adjusted > 0) {
        addLog("success", `Price adjusted: EUR ${Number(row.shopify_price).toFixed(2)} -> EUR ${Number(row.competitor_price_avg).toFixed(2)}`);
        setEnrichments((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, shopify_price: row.competitor_price_avg, price_position: "fair" }
              : e
          )
        );
        setSelectedRow(null);
      } else {
        addLog("error", `Price adjust failed: ${data.errors?.[0] || data.message || "Unknown error"}`);
      }
    } catch (e) {
      addLog("error", `Price error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const [priceProgress, setPriceProgress] = useState<{
    total: number;
    done: number;
    adjusted: number;
    failed: number;
    skipped: number;
    results: Array<{ title: string; old_price: number; new_price: number; status: string }>;
  } | null>(null);

  const handleBulkAdjustPrices = async (strategy: "match_avg" | "undercut_5" | "undercut_10") => {
    const overpriced = enrichments.filter(
      (e) =>
        e.price_position === "overpriced" &&
        e.competitor_price_avg != null &&
        e.shopify_price != null &&
        (e.status === "approved" || e.status === "applied")
    );
    if (overpriced.length === 0) {
      addLog("warning", "No overpriced approved products to adjust");
      return;
    }
    const strategyLabel =
      strategy === "match_avg"
        ? "match competitor average"
        : strategy === "undercut_5"
          ? "undercut by 5%"
          : "undercut by 10%";
    const confirmMsg = `Adjust prices for ${overpriced.length} overpriced products to ${strategyLabel}? Original prices will be shown as "compare at" price on Shopify.`;
    if (!window.confirm(confirmMsg)) return;

    setLoading("bulk_price");
    const progress = {
      total: overpriced.length,
      done: 0,
      adjusted: 0,
      failed: 0,
      skipped: 0,
      results: [] as Array<{ title: string; old_price: number; new_price: number; status: string }>,
    };
    setPriceProgress({ ...progress });
    addLog("info", `Bulk adjusting ${overpriced.length} prices (${strategyLabel})...`);

    // Process in batches of 5 to avoid timeout
    const BATCH_SIZE = 5;
    const ids = overpriced.map((e) => e.id);

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batchIds = ids.slice(i, i + BATCH_SIZE);
      try {
        const res = await fetch("/api/enrich-products", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "adjust_prices",
            ids: batchIds,
            strategy,
          }),
        });
        const data = await res.json();
        if (data.status === "success") {
          progress.done += batchIds.length;
          progress.adjusted += data.adjusted || 0;
          progress.failed += data.failed || 0;
          progress.skipped += data.skipped || 0;
          if (data.results) {
            progress.results.push(...data.results);
          }
          if (data.errors?.length) {
            for (const err of data.errors) {
              addLog("error", err);
            }
          }
          // Update enrichments locally for adjusted items
          if (data.results?.length) {
            const adjustedTitles = new Set(
              data.results
                .filter((r: { status: string }) => r.status === "adjusted")
                .map((r: { title: string }) => r.title)
            );
            setEnrichments((prev) =>
              prev.map((e) =>
                adjustedTitles.has(e.shopify_title)
                  ? { ...e, price_position: "fair" }
                  : e
              )
            );
          }
        } else {
          progress.done += batchIds.length;
          progress.failed += batchIds.length;
          addLog("error", `Batch failed: ${data.message}`);
        }
      } catch (e) {
        progress.done += batchIds.length;
        progress.failed += batchIds.length;
        addLog("error", `Batch error: ${e instanceof Error ? e.message : String(e)}`);
      }
      setPriceProgress({ ...progress });
      addLog(
        "info",
        `Progress: ${progress.done}/${progress.total} (${progress.adjusted} adjusted, ${progress.failed} failed)`
      );
    }

    addLog(
      "success",
      `Price adjustment complete: ${progress.adjusted} adjusted, ${progress.skipped} skipped, ${progress.failed} failed`
    );
    setLoading(null);
  };

  const filtered = enrichments.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.shopify_title.toLowerCase().includes(q) ||
      (e.catalog_display_name || "").toLowerCase().includes(q) ||
      (e.shopify_vendor || "").toLowerCase().includes(q) ||
      (e.key_actives || []).some((a) => a.toLowerCase().includes(q))
    );
  });

  const filteredByConfidence = filtered.filter((e) => {
    if (confidenceFilter === "all") return true;
    return e.confidence === confidenceFilter;
  });

  const pendingCount = enrichments.filter(
    (e) => e.status !== "approved" && e.status !== "rejected"
  ).length;

  const logLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success": return "text-[#4A7C59]";
      case "error": return "text-[#B76E79]";
      case "warning": return "text-[#C4963C]";
      default: return "text-[#6B5B4F]";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E8E4DC]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E8E4DC] text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[#9E6B73]">
                Intelligence
              </p>
              <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
                Product Enrichment
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-full border border-[#E8E4DC] px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
            >
              All Tools
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Action row */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={runAutoMatch}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-2.5 text-sm font-medium text-[#FAFAF8] transition-all hover:bg-[#333] disabled:opacity-50"
            suppressHydrationWarning
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              {loading === "match" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </span>
            <span>Auto-Match Shopify Products</span>
          </button>
          <button
            onClick={loadEnrichments}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
            suppressHydrationWarning
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              {loading === "load" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </span>
            <span>Load Results</span>
          </button>
          <button
            onClick={computeBenchmarks}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
            suppressHydrationWarning
          >
            <span className="inline-flex h-4 w-4 items-center justify-center">
              {loading === "benchmark" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
            </span>
            <span>Compute Benchmarks</span>
          </button>
          {enrichments.some((e) => e.status === "approved") && (
            <button
              onClick={handlePushToShopify}
              disabled={loading !== null}
              className="inline-flex items-center gap-2 rounded-full bg-[#4A7C59] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#3D6A4A] disabled:opacity-50"
              suppressHydrationWarning
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">
                {loading === "push" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </span>
              <span>Push to Shopify ({enrichments.filter((e) => e.status === "approved").length})</span>
            </button>
          )}
          {enrichments.some(
            (e) =>
              e.price_position === "overpriced" &&
              e.competitor_price_avg != null &&
              (e.status === "approved" || e.status === "applied")
          ) && (
            <div className="relative group">
              <button
                onClick={() => handleBulkAdjustPrices("match_avg")}
                disabled={loading !== null}
                className="inline-flex items-center gap-2 rounded-full bg-[#C4963C] px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#B38734] disabled:opacity-50"
                suppressHydrationWarning
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  {loading === "bulk_price" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                </span>
                <span>
                  Adjust Overpriced (
                  {
                    enrichments.filter(
                      (e) =>
                        e.price_position === "overpriced" &&
                        e.competitor_price_avg != null &&
                        (e.status === "approved" || e.status === "applied")
                    ).length
                  }
                  )
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Price adjustment progress / results */}
        {priceProgress && (
          <div className="rounded-xl border border-[#C4963C]/30 bg-[#C4963C]/5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">
                {loading === "bulk_price"
                  ? "Adjusting Prices..."
                  : "Price Adjustment Results"}
              </h3>
              {loading !== "bulk_price" && (
                <button
                  onClick={() => setPriceProgress(null)}
                  className="text-[10px] font-medium uppercase tracking-wider text-[#9B9B9B] hover:text-[#6B5B4F]"
                >
                  Dismiss
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#E8E4DC]">
              <div
                className="h-full rounded-full bg-[#C4963C] transition-all duration-300"
                style={{
                  width: `${priceProgress.total > 0 ? (priceProgress.done / priceProgress.total) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Stats */}
            <div className="mb-3 grid grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/60 p-2 text-center">
                <p className="text-lg font-bold text-[#1A1A1A]">{priceProgress.done}/{priceProgress.total}</p>
                <p className="text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Processed</p>
              </div>
              <div className="rounded-lg bg-white/60 p-2 text-center">
                <p className="text-lg font-bold text-[#4A7C59]">{priceProgress.adjusted}</p>
                <p className="text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Adjusted</p>
              </div>
              <div className="rounded-lg bg-white/60 p-2 text-center">
                <p className="text-lg font-bold text-[#9B9B9B]">{priceProgress.skipped}</p>
                <p className="text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Skipped</p>
              </div>
              <div className="rounded-lg bg-white/60 p-2 text-center">
                <p className="text-lg font-bold text-[#B76E79]">{priceProgress.failed}</p>
                <p className="text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Failed</p>
              </div>
            </div>

            {/* Results list */}
            {priceProgress.results.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[#E8E4DC] bg-white">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E8E4DC] bg-[#F5F3EF]">
                      <th className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Product</th>
                      <th className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Old Price</th>
                      <th className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">New Price</th>
                      <th className="px-3 py-1.5 text-[9px] font-medium uppercase tracking-wider text-[#9B9B9B]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceProgress.results.map((r, i) => (
                      <tr key={i} className="border-b border-[#E8E4DC]/50 last:border-0">
                        <td className="max-w-[200px] truncate px-3 py-1.5 text-[#1A1A1A]">{r.title}</td>
                        <td className="px-3 py-1.5 text-[#B76E79] line-through">EUR {r.old_price.toFixed(2)}</td>
                        <td className="px-3 py-1.5 font-medium text-[#4A7C59]">EUR {r.new_price.toFixed(2)}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-medium uppercase ${
                              r.status === "adjusted"
                                ? "bg-[#4A7C59]/10 text-[#4A7C59]"
                                : r.status.startsWith("skipped")
                                  ? "bg-[#9B9B9B]/10 text-[#9B9B9B]"
                                  : "bg-[#B76E79]/10 text-[#B76E79]"
                            }`}
                          >
                            {r.status === "adjusted"
                              ? "Done"
                              : r.status === "skipped_minimal_change"
                                ? "Skipped"
                                : r.status.startsWith("error_")
                                  ? `HTTP ${r.status.replace("error_", "")}`
                                  : r.status === "no_variants"
                                    ? "No Variants"
                                    : "Failed"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Match result banner */}
        {matchResult && matchResult.status === "success" && (
          <div className="mb-8 rounded-2xl border border-[#4A7C59]/20 bg-[#4A7C59]/5 p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Shopify Products
                </p>
                <p className="text-2xl font-semibold text-[#1A1A1A]">
                  {matchResult.total_shopify}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Matched
                </p>
                <p className="text-2xl font-semibold text-[#4A7C59]">
                  {matchResult.matched}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  High Confidence
                </p>
                <p className="text-2xl font-semibold text-[#9E6B73]">
                  {matchResult.high_confidence}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Match Rate
                </p>
                <p className="text-2xl font-semibold text-[#1A1A1A]">
                  {matchResult.match_rate}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats row */}
        {stats && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#9E6B73]/10 text-[#9E6B73]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Total Matches
                </p>
                <p className="text-xl font-semibold text-[#1A1A1A]">
                  {stats.total}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6B5B4F]/10 text-[#6B5B4F]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Avg Similarity
                </p>
                <p className="text-xl font-semibold text-[#1A1A1A]">
                  {(stats.avg_similarity * 100).toFixed(1)}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#4A7C59]/10 text-[#4A7C59]">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  High Confidence
                </p>
                <p className="text-xl font-semibold text-[#1A1A1A]">
                  {stats.by_confidence.find((c) => c.confidence === "high")?.count || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C4963C]/10 text-[#C4963C]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
                  Underpriced
                </p>
                <p className="text-xl font-semibold text-[#1A1A1A]">
                  {stats.by_price_position.find((p) => p.price_position === "underpriced")?.count || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {["all", "high", "medium", "low"].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setConfidenceFilter(c);
                }}
                className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                  confidenceFilter === c
                    ? "bg-[#1A1A1A] text-[#FAFAF8]"
                    : "border border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9B9B9B]" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-56 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] pl-9 pr-4 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:border-[#9E6B73] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Results table */}
          <div className="lg:col-span-2">
            {/* Bulk actions */}
            {filteredByConfidence.length > 0 && pendingCount > 0 && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#E8E4DC] bg-white px-4 py-3">
                <span className="text-xs text-[#6B5B4F]">
                  {pendingCount} pending
                </span>
                <button
                  onClick={handleApproveFiltered}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#4A7C59] px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white transition-colors hover:bg-[#3D6A4A] disabled:opacity-50"
                >
                  {loading === "approve_all" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle className="h-3 w-3" />
                  )}
                  Approve All{confidenceFilter !== "all" ? ` ${confidenceFilter}` : ""}
                </button>
                <button
                  onClick={handleRejectAll}
                  disabled={loading !== null}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E4DC] px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#B76E79] hover:text-[#B76E79] disabled:opacity-50"
                >
                  {loading === "reject_all" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  Reject All
                </button>
              </div>
            )}

            {filteredByConfidence.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-[#E8E4DC]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#E8E4DC] bg-[#F5F3EF]">
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                        Shopify Product
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                        Match
                      </th>
                      <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B] md:table-cell">
                        Score
                      </th>
                      <th className="hidden px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B] lg:table-cell">
                        Price
                      </th>
                      <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.15em] text-[#9B9B9B]">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredByConfidence.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-[#E8E4DC] transition-colors last:border-0 hover:bg-[#F5F3EF]/60"
                      >
                        <td className="max-w-[200px] px-4 py-3.5">
                          <p className="truncate text-sm font-medium text-[#1A1A1A]">
                            {row.shopify_title}
                          </p>
                          <p className="truncate text-xs text-[#999999]">
                            {row.shopify_vendor}
                            {row.shopify_price
                              ? ` | EUR ${Number(row.shopify_price).toFixed(2)}`
                              : ""}
                          </p>
                        </td>
                        <td className="max-w-[180px] px-4 py-3.5">
                          <p className="truncate text-xs text-[#6B5B4F]">
                            {row.catalog_display_name || "--"}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <ConfidenceBadge level={row.confidence} />
                            <MethodPill method={row.match_method} />
                          </div>
                        </td>
                        <td className="hidden px-4 py-3.5 md:table-cell">
                          <span className="text-sm font-medium text-[#1A1A1A]">
                            {(row.similarity_score * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="hidden px-4 py-3.5 lg:table-cell">
                          <PricePositionBadge position={row.price_position} />
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelectedRow(row)}
                            className="inline-flex items-center gap-1 rounded-full border border-[#E8E4DC] px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
                          >
                            <Eye className="h-3 w-3" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : enrichments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E4DC] py-16">
                <Sparkles className="mb-4 h-10 w-10 text-[#E8E4DC]" />
                <p className="text-sm text-[#999999]">
                  No enrichment data yet
                </p>
                <p className="mt-1 text-xs text-[#CCCCCC]">
                  Click &ldquo;Auto-Match Shopify Products&rdquo; to start
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E4DC] py-16">
                <Search className="mb-4 h-10 w-10 text-[#E8E4DC]" />
                <p className="text-sm text-[#999999]">
                  No results match your search
                </p>
              </div>
            )}
          </div>

          {/* Activity log */}
          <div>
            <div className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-[#1A1A1A]">
                  Activity Log
                </h2>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-[#999999] transition-colors hover:text-[#9E6B73]"
                >
                  Clear
                </button>
              </div>
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-xs text-[#CCCCCC]">No activity yet</p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="shrink-0 font-mono text-[#CCCCCC]">
                        [{log.time}]
                      </span>
                      <span className={logLevelColor(log.level)}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail modal */}
      {selectedRow && (
 <EnrichmentDetail
  row={selectedRow}
  onClose={() => setSelectedRow(null)}
  onStatusChange={handleStatusChange}
  onAdjustPrice={handleAdjustPrice}
        />
      )}
    </div>
  );
}
