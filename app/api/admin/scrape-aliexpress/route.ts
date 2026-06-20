import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin, unauthorized } from "@/lib/admin-auth";
import fs from "fs";
import path from "path";

const OUTPUT_PATH = path.join(process.cwd(), "data", "aliexpress_intelligence.json");
const STAGING_PATH = path.join(process.cwd(), "data", "aliexpress_intelligence_staging.json");

/**
 * GET /api/admin/scrape-aliexpress
 *
 * Returns the current status of the AliExpress scraper output files.
 * The Python scraper (scrapers/aliexpress/scraper_api.py) writes these files;
 * this endpoint reports what's available so the admin UI can show progress.
 */
export async function GET(req: NextRequest) {
  if (!verifyAdmin(req)) return unauthorized();

  const anonymisedExists = fs.existsSync(OUTPUT_PATH);
  const stagingExists = fs.existsSync(STAGING_PATH);

  let anonymisedCount = 0;
  let stagingCount = 0;
  let lastModified: string | null = null;
  let byCategory: Record<string, number> = {};

  if (anonymisedExists) {
    try {
      const raw = fs.readFileSync(OUTPUT_PATH, "utf-8");
      const products: Array<{ category?: string }> = JSON.parse(raw);
      anonymisedCount = products.length;
      lastModified = fs.statSync(OUTPUT_PATH).mtime.toISOString();
      for (const p of products) {
        const cat = p.category || "unknown";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
    } catch {
      // file exists but is unreadable/invalid
    }
  }

  if (stagingExists) {
    try {
      const raw = fs.readFileSync(STAGING_PATH, "utf-8");
      stagingCount = JSON.parse(raw).length;
    } catch {
      // ignore
    }
  }

  return NextResponse.json({
    status: "ok",
    anonymised: {
      exists: anonymisedExists,
      count: anonymisedCount,
      path: "data/aliexpress_intelligence.json",
      last_modified: lastModified,
    },
    staging: {
      exists: stagingExists,
      count: stagingCount,
      path: "data/aliexpress_intelligence_staging.json",
    },
    by_category: byCategory,
    run_commands: {
      by_brand:
        'python scrapers/aliexpress/scraper_api.py --brand "BrandName" --pages 2',
      by_brand_and_category:
        'python scrapers/aliexpress/scraper_api.py --brand "BrandName" --category nail_gel --pages 2',
      all_nail_categories:
        "python scrapers/aliexpress/scraper_api.py --pages 2",
      nail_gel_only:
        "python scrapers/aliexpress/scraper_api.py --pages 2 --category nail_gel",
      via_run_all:
        "python scrapers/run_all.py --sources aliexpress --pages 2",
    },
  });
}
