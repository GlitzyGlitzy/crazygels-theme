const { neon } = require('@neondatabase/serverless');
const { createHash } = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL is not set'); process.exit(1); }
const sql = neon(DATABASE_URL);

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ''; }
    else current += ch;
  }
  fields.push(current.trim());
  return fields;
}

function makeHash(name, brand) {
  const key = `${(name || '').toLowerCase().trim()}|${(brand || '').toLowerCase().trim()}`;
  return createHash('md5').update(key).digest('hex').slice(0, 16);
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (/nagel|nail|gel|press.?on|maniküre/.test(t)) return 'nails';
  if (/serum|hyaluron|retinol|vitamin\s?c/.test(t)) return 'serum';
  if (/creme|cream|moisturiz|balsam|lotion|salbe/.test(t)) return 'cream';
  if (/lippenstift|lipstick|lip\s?gloss|lip/.test(t)) return 'lip';
  if (/mascara|wimper|lash|eyeliner|eye/.test(t)) return 'eye';
  if (/sonnenschutz|sun|spf|lsf|uv/.test(t)) return 'suncare';
  if (/parfum|parfüm|fragrance|eau\s?de/.test(t)) return 'fragrance';
  if (/shampoo|haar|hair|conditioner/.test(t)) return 'hair';
  if (/make.?up|foundation|concealer|primer|bronzer|blush|puder/.test(t)) return 'makeup';
  if (/reinig|cleanser|wash|peeling|toner|micellar/.test(t)) return 'cleanser';
  if (/maske|mask/.test(t)) return 'mask';
  if (/öl|oil/.test(t)) return 'oil';
  return 'skincare';
}

function priceTier(minP, maxP) {
  const avg = (minP && maxP) ? (minP + maxP) / 2 : minP || maxP;
  if (!avg) return null;
  if (avg < 15) return 'budget';
  if (avg < 40) return 'mid';
  if (avg < 100) return 'premium';
  return 'luxury';
}

async function main() {
  console.log('[v0] Fetching CSV from blob storage...');
  const res = await fetch('https://blobs.vusercontent.net/blob/Produkte%20und%20Marken%2C%20die%20Kunden%20auf%20Google%20kaufen_2026-02-22_20_55_48-Usz9zwHRsTcowOdzwIyMHr25EhXKBt.csv');
  if (!res.ok) throw new Error('Failed to fetch CSV: ' + res.status);
  const raw = await res.text();
  console.log('[v0] CSV fetched, parsing...');

  const lines = raw.split('\n').filter(l => l.trim());
  const dataLines = lines.slice(3); // skip title, filter, header rows
  console.log('[v0] Found ' + dataLines.length + ' product rows');

  let imported = 0, skipped = 0, errors = 0;

  for (let i = 0; i < dataLines.length; i++) {
    try {
      const fields = parseCSVLine(dataLines[i]);
      if (fields.length < 4) { skipped++; continue; }

      const [rankStr, title, brand, availability, minPStr, maxPStr, currency, gtinsRaw] = fields;
      if (!title || title === 'Titel') { skipped++; continue; }

      const rank = parseInt(rankStr, 10);
      const minPrice = minPStr ? parseFloat(minPStr) : null;
      const maxPrice = maxPStr ? parseFloat(maxPStr) : null;
      const productHash = makeHash(title, brand);
      const category = guessCategory(title);
      const tier = priceTier(minPrice, maxPrice);
      const gtins = gtinsRaw ? gtinsRaw.split(' ').filter(Boolean) : [];
      const ingredientSummary = gtins.length > 0 ? JSON.stringify({ gtins }) : null;

      await sql`
        INSERT INTO product_catalog (
          product_hash, display_name, brand, category, price_tier,
          price_original, retail_price, price_currency, source, status,
          review_signals, acquisition_lead, ingredient_summary,
          created_at, updated_at
        ) VALUES (
          ${productHash}, ${title}, ${brand || null}, ${category}, ${tier},
          ${maxPrice}, ${minPrice}, ${currency || 'EUR'}, 'google_suggestion', 'research',
          ${availability || null}, ${'google_rank_' + rank}, ${ingredientSummary},
          NOW(), NOW()
        )
        ON CONFLICT (product_hash) DO UPDATE SET
          review_signals = EXCLUDED.review_signals,
          acquisition_lead = EXCLUDED.acquisition_lead,
          price_original = COALESCE(EXCLUDED.price_original, product_catalog.price_original),
          retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price),
          updated_at = NOW()
      `;
      imported++;
    } catch (e) {
      errors++;
      if (errors <= 3) console.error('[v0] Row ' + i + ' error:', e.message);
    }

    if ((i + 1) % 500 === 0) {
      console.log('[v0] Progress: ' + (i + 1) + '/' + dataLines.length + ' (imported: ' + imported + ', errors: ' + errors + ')');
    }
  }

  console.log('\n[v0] Import complete:');
  console.log('  Imported/updated: ' + imported);
  console.log('  Skipped: ' + skipped);
  console.log('  Errors: ' + errors);

  const summary = await sql`
    SELECT category, COUNT(*)::int AS cnt
    FROM product_catalog WHERE source = 'google_suggestion'
    GROUP BY category ORDER BY cnt DESC
  `;
  console.log('\n[v0] Google suggestions by category:');
  for (const row of summary) {
    console.log('  ' + row.category + ': ' + row.cnt);
  }
}

main().catch(e => { console.error('[v0] Fatal:', e); process.exit(1); });
