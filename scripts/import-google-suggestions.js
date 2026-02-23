const { neon } = require('@neondatabase/serverless');
const { createHash } = require('crypto');

const sql = neon(process.env.DATABASE_URL);

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
  const key = (name || '').toLowerCase().trim() + '|' + (brand || '').toLowerCase().trim();
  return createHash('md5').update(key).digest('hex').slice(0, 16);
}

function guessCategory(title) {
  const t = title.toLowerCase();
  if (/nagel|nail|gel|press.?on|manik/.test(t)) return 'nails';
  if (/serum|hyaluron|retinol|vitamin.?c/.test(t)) return 'serum';
  if (/creme|cream|moisturiz|balsam|lotion|salbe/.test(t)) return 'cream';
  if (/lippenstift|lipstick|lip.?gloss|lip/.test(t)) return 'lip';
  if (/mascara|wimper|lash|eyeliner|eye/.test(t)) return 'eye';
  if (/sonnenschutz|sun|spf|lsf|uv/.test(t)) return 'suncare';
  if (/parfum|fragrance|eau.?de/.test(t)) return 'fragrance';
  if (/shampoo|haar|hair|conditioner/.test(t)) return 'hair';
  if (/make.?up|foundation|concealer|primer|bronzer|blush|puder/.test(t)) return 'makeup';
  if (/reinig|cleanser|wash|peeling|toner|micellar/.test(t)) return 'cleanser';
  if (/maske|mask/.test(t)) return 'mask';
  if (/oil/.test(t)) return 'oil';
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

(async () => {
  try {
    console.log('[v0] Fetching CSV...');
    const csvUrl = 'https://blobs.vusercontent.net/blob/Produkte%20und%20Marken%2C%20die%20Kunden%20auf%20Google%20kaufen_2026-02-22_20_55_48-Usz9zwHRsTcowOdzwIyMHr25EhXKBt.csv';
    const res = await fetch(csvUrl);
    if (!res.ok) { console.error('Fetch failed: ' + res.status); return; }
    const raw = await res.text();
    console.log('[v0] CSV fetched, size: ' + raw.length + ' chars');

    const lines = raw.split('\n').filter(function(l) { return l.trim().length > 0; });
    console.log('[v0] Total lines: ' + lines.length);

    // Skip header rows (line 0 = title, line 1 = filter, line 2 = column headers)
    const dataLines = lines.slice(3);
    console.log('[v0] Data rows: ' + dataLines.length);

    var imported = 0;
    var skipped = 0;
    var errors = 0;

    for (var i = 0; i < dataLines.length; i++) {
      try {
        var fields = parseCSVLine(dataLines[i]);
        if (fields.length < 4) { skipped++; continue; }

        var title = fields[1];
        var brand = fields[2];
        var availability = fields[3];
        var minPStr = fields[4];
        var maxPStr = fields[5];
        var currency = fields[6];
        var gtinsRaw = fields[7];

        if (!title || title === 'Titel') { skipped++; continue; }

        var rank = parseInt(fields[0], 10);
        var minPrice = minPStr ? parseFloat(minPStr) : null;
        var maxPrice = maxPStr ? parseFloat(maxPStr) : null;
        var productHash = makeHash(title, brand);
        var category = guessCategory(title);
        var tier = priceTier(minPrice, maxPrice);

        await sql(
          'INSERT INTO product_catalog (product_hash, display_name, brand, category, price_tier, price_original, retail_price, price_currency, source, status, review_signals, acquisition_lead, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW(),NOW()) ON CONFLICT (product_hash) DO UPDATE SET review_signals = EXCLUDED.review_signals, acquisition_lead = EXCLUDED.acquisition_lead, price_original = COALESCE(EXCLUDED.price_original, product_catalog.price_original), retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price), updated_at = NOW()',
          [productHash, title, brand || null, category, tier, maxPrice, minPrice, currency || 'EUR', 'google_suggestion', 'research', availability || null, 'google_rank_' + rank]
        );
        imported++;
      } catch (e) {
        errors++;
        if (errors <= 5) console.error('[v0] Row ' + i + ' error: ' + e.message);
      }

      if ((i + 1) % 500 === 0) {
        console.log('[v0] Progress: ' + (i + 1) + '/' + dataLines.length + ' (imported=' + imported + ', errors=' + errors + ')');
      }
    }

    console.log('[v0] Import complete: imported=' + imported + ', skipped=' + skipped + ', errors=' + errors);

    var summary = await sql('SELECT category, COUNT(*)::int AS cnt FROM product_catalog WHERE source = $1 GROUP BY category ORDER BY cnt DESC', ['google_suggestion']);
    console.log('[v0] By category:');
    for (var j = 0; j < summary.length; j++) {
      console.log('  ' + summary[j].category + ': ' + summary[j].cnt);
    }
  } catch (e) {
    console.error('[v0] Fatal: ' + e.message);
    console.error(e.stack);
  }
})();
