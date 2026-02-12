"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Database,
  Upload,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  FileJson,
  Stethoscope,
  AlertTriangle,
} from "lucide-react";

interface DBStatus {
  status: string;
  tables?: {
    product_catalog: { exists: boolean; rows: number };
    anonymised_products: { exists: boolean; rows: number };
  };
  message?: string;
}

interface HealthResult {
  status: string;
  product_count?: number;
  diagnostics?: Record<string, unknown>;
  message?: string;
  hint?: string;
}

interface ImportResult {
  status: string;
  product_catalog?: { inserted: number; updated: number; errors: number };
  anonymised_products?: { inserted: number };
  total_processed?: number;
  error_details?: string[];
  message?: string;
}

interface CatalogStats {
  status: string;
  product_catalog: number;
  anonymised_products: number;
  by_category: Array<{ category: string; count: string }>;
  by_source: Array<{ source: string; count: string }>;
  recent: Array<{
    product_hash: string;
    display_name: string;
    category: string;
    product_type: string;
    price_tier: string;
    efficacy_score: number | null;
    source: string;
    created_at: string;
  }>;
  message?: string;
}

interface DiagnoseStep {
  step: string;
  status: "pass" | "fail" | "skip";
  detail: string;
  ms?: number;
}

type LogEntry = {
  time: string;
  level: "info" | "success" | "error" | "warning";
  message: string;
};

export default function ScraperTestPage() {
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [healthResult, setHealthResult] = useState<HealthResult | null>(null);
  const [diagnoseSteps, setDiagnoseSteps] = useState<DiagnoseStep[] | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [catalogStats, setCatalogStats] = useState<CatalogStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [jsonInput, setJsonInput] = useState("");

  const addLog = useCallback(
    (level: LogEntry["level"], message: string) => {
      setLogs((prev) => [
        ...prev,
        {
          time: new Date().toLocaleTimeString(),
          level,
          message,
        },
      ]);
    },
    []
  );

  const setupDB = async () => {
    setLoading("setup");
    addLog("info", "Setting up database tables...");
    try {
      const res = await fetch("/api/db-setup", { method: "POST" });
      const data: DBStatus = await res.json();
      setDbStatus(data);
      if (data.status === "success") {
        addLog("success", `Tables created. product_catalog: ${data.tables?.product_catalog.rows} rows, anonymised_products: ${data.tables?.anonymised_products.rows} rows`);
      } else {
        addLog("error", `DB setup failed: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `DB setup error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const checkHealth = async () => {
    setLoading("health");
    addLog("info", "Checking database health...");
    try {
      const res = await fetch("/api/db-health");
      const data: HealthResult = await res.json();
      setHealthResult(data);
      if (data.status === "connected") {
        addLog("success", `DB connected. ${data.product_count ?? 0} products in catalog. Latency: ${data.diagnostics?.latency_ms}ms`);
        if (data.diagnostics?.tables) {
          addLog("info", `Tables found: ${(data.diagnostics.tables as string[]).join(", ") || "none"}`);
        }
      } else {
        addLog("error", `DB health: ${data.message}`);
        if (data.hint) {
          addLog("warning", `Hint: ${data.hint}`);
        }
        if (data.diagnostics) {
          const d = data.diagnostics;
          addLog("info", `Config: host=${d.rds_host}, db=${d.rds_database}, user=${d.rds_user}, password=${d.rds_password}, ssl=${d.rds_ssl}`);
        }
      }
    } catch (e) {
      addLog("error", `Health check error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const loadStats = async () => {
    setLoading("stats");
    addLog("info", "Loading catalog stats...");
    try {
      const res = await fetch("/api/import-products");
      const data: CatalogStats = await res.json();
      setCatalogStats(data);
      if (data.status === "connected") {
        addLog("success", `Catalog: ${data.product_catalog} products, ${data.anonymised_products} anonymised`);
      } else {
        addLog("error", `Stats error: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `Stats error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const runDiagnose = async () => {
    setLoading("diagnose");
    setDiagnoseSteps(null);
    addLog("info", "Running deep connection diagnostics (DNS -> TCP -> Postgres)...");
    try {
      const res = await fetch("/api/db-diagnose");
      const data = await res.json();
      setDiagnoseSteps(data.steps || []);
      const failed = (data.steps || []).filter((s: DiagnoseStep) => s.status === "fail");
      const passed = (data.steps || []).filter((s: DiagnoseStep) => s.status === "pass");
      if (failed.length === 0) {
        addLog("success", `All ${passed.length} diagnostic steps passed!`);
      } else {
        addLog("error", `${failed.length} step(s) failed: ${failed.map((s: DiagnoseStep) => s.step).join(", ")}`);
        for (const s of failed) {
          addLog("warning", `[${s.step}] ${s.detail.split("\n")[0]}`);
        }
      }
    } catch (e) {
      addLog("error", `Diagnose error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const importProducts = async () => {
    if (!jsonInput.trim()) {
      addLog("warning", "Paste your scraped JSON into the text area first");
      return;
    }
    setLoading("import");
    addLog("info", "Importing products...");
    try {
      const parsed = JSON.parse(jsonInput);
      const products = Array.isArray(parsed)
        ? parsed
        : parsed.products || [];
      addLog("info", `Parsed ${products.length} products from JSON`);

      const res = await fetch("/api/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const data: ImportResult = await res.json();
      setImportResult(data);

      if (data.status === "success") {
        addLog(
          "success",
          `Import complete: ${data.product_catalog?.inserted} inserted, ${data.product_catalog?.updated} updated, ${data.product_catalog?.errors} errors`
        );
      } else {
        addLog("error", `Import failed: ${data.message}`);
      }
    } catch (e) {
      addLog("error", `Import error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(null);
  };

  const loadSampleData = () => {
    const sample = JSON.stringify(
      [
        {
          product_hash: "test_001_hash_abc",
          source: "sephora_de",
          category: "skincare_serums",
          name_clean: "Vitamin C Brightening Serum",
          brand_type: "mid_range",
          price_tier: "mid",
          efficacy_signals: { rating: 4.5, review_count: 1200, has_ingredients: true },
          ingredient_profile: { actives: ["vitamin_c", "niacinamide"], notable: [] },
          market_signals: { in_stock: true, has_sale: false },
          acquisition_lead: "ACQ-TEST0001",
        },
        {
          product_hash: "test_002_hash_def",
          source: "sephora_de",
          category: "skincare_moisturizers",
          name_clean: "Hyaluronic Acid Deep Moisture Cream",
          brand_type: "premium",
          price_tier: "premium",
          efficacy_signals: { rating: 4.8, review_count: 3500, has_ingredients: true },
          ingredient_profile: { actives: ["hyaluronic_acid", "ceramide"], notable: [] },
          market_signals: { in_stock: true, has_sale: true, sale_discount: 15.0 },
          acquisition_lead: "ACQ-TEST0002",
        },
        {
          product_hash: "test_003_hash_ghi",
          source: "amazon_de",
          category: "skincare_serums",
          name_clean: "Retinol Anti-Aging Night Serum",
          brand_type: "mass_market",
          price_tier: "budget",
          efficacy_signals: { rating: 4.2, review_count: 800, has_ingredients: true },
          ingredient_profile: { actives: ["retinol"], notable: ["fragrance"] },
          market_signals: { in_stock: true, has_sale: false },
          acquisition_lead: "ACQ-TEST0003",
        },
      ],
      null,
      2
    );
    setJsonInput(sample);
    addLog("info", "Loaded 3 sample products into the editor");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonInput(text);
      try {
        const parsed = JSON.parse(text);
        const count = Array.isArray(parsed)
          ? parsed.length
          : parsed.products?.length || 0;
        addLog("info", `Loaded ${count} products from ${file.name}`);
      } catch {
        addLog("warning", `Loaded file ${file.name} (JSON parse pending)`);
      }
    };
    reader.readAsText(file);
  };

  const logLevelColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "text-emerald-700";
      case "error":
        return "text-red-700";
      case "warning":
        return "text-amber-700";
      default:
        return "text-[#6B5B4F]";
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
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
                Scraper Pipeline
              </p>
              <h1 className="font-serif text-2xl font-light tracking-tight text-[#1A1A1A]">
                Database Import Test
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={setupDB}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
          >
            {loading === "setup" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            Setup Tables
          </button>
          <button
            onClick={checkHealth}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
          >
            {loading === "health" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Check Health
          </button>
          <button
            onClick={loadStats}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] transition-all hover:border-[#9E6B73] hover:text-[#9E6B73] disabled:opacity-50"
          >
            {loading === "stats" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Load Stats
          </button>
          <button
            onClick={runDiagnose}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-5 py-2.5 text-sm font-medium text-amber-800 transition-all hover:border-amber-400 hover:bg-amber-100 disabled:opacity-50"
          >
            {loading === "diagnose" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Stethoscope className="h-4 w-4" />
            )}
            Diagnose Connection
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Import */}
          <div className="flex flex-col gap-6">
            {/* JSON Input */}
            <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-[#1A1A1A]">
                  Import JSON
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={loadSampleData}
                    className="rounded-full border border-[#E8E4DC] px-3 py-1.5 text-xs font-medium text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]"
                  >
                    Load Sample
                  </button>
                  <label className="cursor-pointer rounded-full border border-[#E8E4DC] px-3 py-1.5 text-xs font-medium text-[#6B5B4F] transition-colors hover:border-[#9E6B73] hover:text-[#9E6B73]">
                    <span className="inline-flex items-center gap-1">
                      <FileJson className="h-3 w-3" />
                      Upload File
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-[#999999]">
                Paste the output from{" "}
                <code className="rounded bg-[#F0EDE8] px-1.5 py-0.5 text-[#6B5B4F]">
                  data/sephora_intelligence.json
                </code>{" "}
                or{" "}
                <code className="rounded bg-[#F0EDE8] px-1.5 py-0.5 text-[#6B5B4F]">
                  data/combined_intelligence.json
                </code>{" "}
                here, or upload the file directly.
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='[{"product_hash": "...", "name_clean": "...", ...}]'
                className="h-48 w-full resize-y rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] p-4 font-mono text-xs text-[#1A1A1A] placeholder-[#CCCCCC] focus:border-[#9E6B73] focus:outline-none focus:ring-1 focus:ring-[#9E6B73]/20"
              />
              <button
                onClick={importProducts}
                disabled={loading !== null || !jsonInput.trim()}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#9E6B73] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[#8A5A62] disabled:opacity-50"
              >
                {loading === "import" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Import to Database
              </button>
            </section>

            {/* Import Result */}
            {importResult && (
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                  Import Result
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  {importResult.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${importResult.status === "success" ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {importResult.status === "success"
                      ? "Import successful"
                      : importResult.message}
                  </span>
                </div>
                {importResult.product_catalog && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-xl bg-emerald-50 p-4 text-center">
                      <p className="text-2xl font-semibold text-emerald-700">
                        {importResult.product_catalog.inserted}
                      </p>
                      <p className="text-xs text-emerald-600">Inserted</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4 text-center">
                      <p className="text-2xl font-semibold text-blue-700">
                        {importResult.product_catalog.updated}
                      </p>
                      <p className="text-xs text-blue-600">Updated</p>
                    </div>
                    <div className="rounded-xl bg-red-50 p-4 text-center">
                      <p className="text-2xl font-semibold text-red-700">
                        {importResult.product_catalog.errors}
                      </p>
                      <p className="text-xs text-red-600">Errors</p>
                    </div>
                  </div>
                )}
                {importResult.error_details &&
                  importResult.error_details.length > 0 && (
                    <div className="mt-4 rounded-xl bg-red-50 p-4">
                      <p className="mb-2 text-xs font-medium text-red-700">
                        Error Details:
                      </p>
                      {importResult.error_details.map((err, i) => (
                        <p
                          key={i}
                          className="text-xs text-red-600 font-mono"
                        >
                          {err}
                        </p>
                      ))}
                    </div>
                  )}
              </section>
            )}
          </div>

          {/* Right Column: Status + Products */}
          <div className="flex flex-col gap-6">
            {/* Deep Diagnostics */}
            {diagnoseSteps && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50/30 p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-amber-700" />
                  <h2 className="text-lg font-medium text-[#1A1A1A]">
                    Connection Diagnostics
                  </h2>
                </div>
                <div className="flex flex-col gap-3">
                  {diagnoseSteps.map((step, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 ${
                        step.status === "pass"
                          ? "border-emerald-200 bg-emerald-50/50"
                          : step.status === "fail"
                          ? "border-red-200 bg-red-50/50"
                          : "border-[#E8E4DC] bg-[#F5F3EE]"
                      }`}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {step.status === "pass" ? (
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : step.status === "fail" ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-[#999999]" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              step.status === "pass"
                                ? "text-emerald-800"
                                : step.status === "fail"
                                ? "text-red-800"
                                : "text-[#6B5B4F]"
                            }`}
                          >
                            {step.step}
                          </span>
                        </div>
                        {step.ms !== undefined && (
                          <span className="text-xs text-[#999999]">{step.ms}ms</span>
                        )}
                      </div>
                      <p
                        className={`text-xs leading-relaxed whitespace-pre-wrap ${
                          step.status === "pass"
                            ? "text-emerald-700"
                            : step.status === "fail"
                            ? "text-red-700"
                            : "text-[#6B5B4F]"
                        }`}
                      >
                        {step.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DB Status */}
            {dbStatus && (
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                  Database Status
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  {dbStatus.status === "success" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {dbStatus.status === "success"
                      ? "Tables ready"
                      : dbStatus.message}
                  </span>
                </div>
                {dbStatus.tables && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#E8E4DC] p-3">
                      <p className="text-xs text-[#999999]">product_catalog</p>
                      <p className="text-lg font-semibold text-[#1A1A1A]">
                        {dbStatus.tables.product_catalog.rows}
                        <span className="ml-1 text-xs font-normal text-[#999999]">rows</span>
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#E8E4DC] p-3">
                      <p className="text-xs text-[#999999]">anonymised_products</p>
                      <p className="text-lg font-semibold text-[#1A1A1A]">
                        {dbStatus.tables.anonymised_products.rows}
                        <span className="ml-1 text-xs font-normal text-[#999999]">rows</span>
                      </p>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Health Diagnostics */}
            {healthResult && (
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                  Connection Diagnostics
                </h2>
                <div className="flex items-center gap-2 mb-4">
                  {healthResult.status === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-medium ${healthResult.status === "connected" ? "text-emerald-700" : "text-red-700"}`}
                  >
                    {healthResult.status === "connected"
                      ? `Connected - ${healthResult.product_count} products`
                      : healthResult.message}
                  </span>
                </div>
                {healthResult.hint && (
                  <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <p className="text-xs font-medium text-amber-800 mb-1">Troubleshooting Hint</p>
                    <p className="text-xs leading-relaxed text-amber-700">{healthResult.hint}</p>
                  </div>
                )}
                {healthResult.diagnostics && (
                  <div className="rounded-xl bg-[#F5F3EE] p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#999999]">
                      Environment
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {Object.entries(healthResult.diagnostics).map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-2 text-xs">
                          <span className="font-mono text-[#6B5B4F] shrink-0">{key}</span>
                          <span className="font-mono text-[#1A1A1A] text-right break-all">
                            {typeof value === "object"
                              ? Array.isArray(value)
                                ? (value as string[]).join(", ") || "none"
                                : JSON.stringify(value)
                              : String(value ?? "null")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Catalog Stats */}
            {catalogStats && catalogStats.status === "connected" && (
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                  Catalog Overview
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-[#E8E4DC] p-3">
                    <p className="text-xs text-[#999999]">Total Products</p>
                    <p className="text-2xl font-semibold text-[#9E6B73]">
                      {catalogStats.product_catalog}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#E8E4DC] p-3">
                    <p className="text-xs text-[#999999]">Anonymised</p>
                    <p className="text-2xl font-semibold text-[#6B5B4F]">
                      {catalogStats.anonymised_products}
                    </p>
                  </div>
                </div>
                {catalogStats.by_category.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#999999]">
                      By Category
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {catalogStats.by_category.map((c) => (
                        <span
                          key={c.category}
                          className="rounded-full bg-[#F0EDE8] px-3 py-1 text-xs text-[#6B5B4F]"
                        >
                          {c.category || "unknown"}: {c.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {catalogStats.by_source.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[#999999]">
                      By Source
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {catalogStats.by_source.map((s) => (
                        <span
                          key={s.source}
                          className="rounded-full bg-[#F0EDE8] px-3 py-1 text-xs text-[#6B5B4F]"
                        >
                          {s.source || "unknown"}: {s.count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Recent Products */}
            {catalogStats?.recent && catalogStats.recent.length > 0 && (
              <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
                <h2 className="mb-4 text-lg font-medium text-[#1A1A1A]">
                  Recent Products
                </h2>
                <div className="flex flex-col gap-2">
                  {catalogStats.recent.map((p) => (
                    <div
                      key={p.product_hash}
                      className="flex items-start justify-between gap-4 rounded-xl border border-[#E8E4DC] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#1A1A1A]">
                          {p.display_name}
                        </p>
                        <p className="text-xs text-[#999999]">
                          {p.product_type} | {p.price_tier} | {p.source}
                        </p>
                      </div>
                      {p.efficacy_score && (
                        <span className="shrink-0 rounded-full bg-[#9E6B73]/10 px-2 py-0.5 text-xs font-medium text-[#9E6B73]">
                          {p.efficacy_score}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Logs */}
            <section className="rounded-2xl border border-[#E8E4DC] bg-[#FAFAF8] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-medium text-[#1A1A1A]">
                  Activity Log
                </h2>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="text-xs text-[#999999] hover:text-[#9E6B73]"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto rounded-xl bg-[#F5F3EE] p-4">
                {logs.length === 0 ? (
                  <p className="text-center text-xs text-[#CCCCCC]">
                    No activity yet. Click a button above to start.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {logs.map((log, i) => (
                      <p key={i} className="text-xs font-mono">
                        <span className="text-[#999999]">[{log.time}]</span>{" "}
                        <span className={logLevelColor(log.level)}>
                          {log.message}
                        </span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
