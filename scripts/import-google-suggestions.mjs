/**
 * Import Google Merchant Center product suggestions into product_catalog
 * as research leads with status 'google_suggestion'.
 *
 * CSV columns:
 *   Beliebtheitsrang, Titel, Marke, Verfügbarkeit,
 *   Mindestpreisspanne, Maximale Preisspanne, Preisspanne Währung, GTINs
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── CSV parser (handles quoted fields with commas) ──────────────────────────
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

// ── Generate product hash consistent with existing scrapers ─────────────────
function makeProductHash(name, brand) {
  const key = `${(name || '').toLowerCase().trim()}|${(brand || '').toLowerCase().trim()}`;
  return createHash('md5').update(key).digest('hex').slice(0, 16);
}

// ── Determine category from product title (German) ──────────────────────────
function guessCategory(title) {
  const t = title.toLowerCase();
  if (/serum|hyaluron|retinol|vitamin\s?c|booster/.test(t)) return 'serum';
  if (/creme|cream|moisturiz|balsam|balm|baume|lotion|salbe/.test(t)) return 'cream';
  if (/lippenstift|lipstick|lip\s?gloss|lip/.test(t)) return 'lip';
  if (/mascara|wimper|lash|eyeliner|eye/.test(t)) return 'eye';
  if (/sonnenschutz|sun|spf|lsf|uv/.test(t)) return 'suncare';
  if (/parfum|parfüm|fragrance|eau\s?de|duft/.test(t)) return 'fragrance';
  if (/nagel|nail|gel|press.?on|maniküre/.test(t)) return 'nails';
  if (/shampoo|haar|hair|conditioner/.test(t)) return 'hair';
  if (/make.?up|foundation|concealer|primer|bronzer|blush|puder|powder/.test(t)) return 'makeup';
  if (/reinig|cleanser|wash|peeling|toner|micellar/.test(t)) return 'cleanser';
  if (/maske|mask/.test(t)) return 'mask';
  if (/öl|oil/.test(t)) return 'oil';
  return 'skincare';
}

// ── Determine price tier ────────────────────────────────────────────────────
function priceTier(minPrice, maxPrice) {
  const avg = (minPrice && maxPrice) ? (minPrice + maxPrice) / 2 : minPrice || maxPrice;
  if (!avg) return null;
  if (avg < 15) return 'budget';
  if (avg < 40) return 'mid';
  if (avg < 100) return 'premium';
  return 'luxury';
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = join(__dirname, 'google-suggestions.csv');
  const raw = readFileSync(csvPath, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());

  // Skip header rows (line 1 = title, line 2 = filter, line 3 = column headers)
  const dataLines = lines.slice(3);
  console.log(`[v0] Found ${dataLines.length} product rows in CSV`);

  // Check how many google_suggestion entries already exist
  const existing = await sql`
    SELECT COUNT(*)::int AS cnt FROM product_catalog WHERE source = 'google_suggestion'
  `;
  console.log(`[v0] Existing google_suggestion entries: ${existing[0].cnt}`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < dataLines.length; i += BATCH_SIZE) {
    const batch = dataLines.slice(i, i + BATCH_SIZE);
    const values = [];

    for (const line of batch) {
      try {
        const fields = parseCSVLine(line);
        if (fields.length < 4) { skipped++; continue; }

        const [rankStr, title, brand, availability, minPriceStr, maxPriceStr, currency, gtinsRaw] = fields;

        if (!title || title === 'Titel') { skipped++; continue; }

        const rank = parseInt(rankStr, 10);
        const minPrice = minPriceStr ? parseFloat(minPriceStr) : null;
        const maxPrice = maxPriceStr ? parseFloat(maxPriceStr) : null;
        const productHash = makeProductHash(title, brand);
        const category = guessCategory(title);
        const tier = priceTier(minPrice, maxPrice);
        const gtins = gtinsRaw ? gtinsRaw.split(' ').filter(Boolean) : [];

        values.push({
          productHash,
          displayName: title,
          brand: brand || null,
          category,
          priceTier: tier,
          priceOriginal: maxPrice,
          retailPrice: minPrice,
          priceCurrency: currency || 'EUR',
          source: 'google_suggestion',
          status: 'research',
          reviewSignals: availability || null,
          acquisitionLead: `google_rank_${rank}`,
          ingredientSummary: gtins.length > 0 ? JSON.stringify({ gtins }) : null,
        });
      } catch (e) {
        errors++;
      }
    }

    if (values.length === 0) continue;

    // Batch insert using a single query with unnest
    try {
      const result = await sql`
        INSERT INTO product_catalog (
          product_hash, display_name, brand, category, price_tier,
          price_original, retail_price, price_currency, source, status,
          review_signals, acquisition_lead, ingredient_summary,
          created_at, updated_at
        )
        SELECT
          unnest(${values.map(v => v.productHash)}::text[]),
          unnest(${values.map(v => v.displayName)}::text[]),
          unnest(${values.map(v => v.brand)}::text[]),
          unnest(${values.map(v => v.category)}::text[]),
          unnest(${values.map(v => v.priceTier)}::text[]),
          unnest(${values.map(v => v.priceOriginal)}::numeric[]),
          unnest(${values.map(v => v.retailPrice)}::numeric[]),
          unnest(${values.map(v => v.priceCurrency)}::text[]),
          unnest(${values.map(v => v.source)}::text[]),
          unnest(${values.map(v => v.status)}::text[]),
          unnest(${values.map(v => v.reviewSignals)}::text[]),
          unnest(${values.map(v => v.acquisitionLead)}::text[]),
          unnest(${values.map(v => v.ingredientSummary)}::jsonb[]),
          NOW(),
          NOW()
        ON CONFLICT (product_hash) DO UPDATE SET
          review_signals = EXCLUDED.review_signals,
          acquisition_lead = EXCLUDED.acquisition_lead,
          price_original = COALESCE(EXCLUDED.price_original, product_catalog.price_original),
          retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price),
          updated_at = NOW()
      `;
      imported += values.length;
    } catch (e) {
      console.error(`[v0] Batch error at row ${i}:`, e.message);
      errors += values.length;
    }

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= dataLines.length) {
      console.log(`[v0] Progress: ${Math.min(i + BATCH_SIZE, dataLines.length)}/${dataLines.length} rows processed`);
    }
  }

  console.log(`\n[v0] Import complete:`);
  console.log(`  Imported/updated: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors: ${errors}`);

  // Show summary by category
  const summary = await sql`
    SELECT category, COUNT(*)::int AS cnt
    FROM product_catalog
    WHERE source = 'google_suggestion'
    GROUP BY category
    ORDER BY cnt DESC
  `;
  console.log(`\n[v0] Google suggestions by category:`);
  for (const row of summary) {
    console.log(`  ${row.category}: ${row.cnt}`);
  }
}

main().catch((e) => {
  console.error('[v0] Fatal error:', e);
  process.exit(1);
});
