const { neon } = require('@neondatabase/serverless');
const { createHash } = require('crypto');

const sql = neon(process.env.DATABASE_URL);

function parseCSVLine(line) {
  var fields = [];
  var current = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    var ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
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

function makeHash(name, brand) {
  var key = (name || '').toLowerCase().trim() + '|' + (brand || '').toLowerCase().trim();
  return createHash('md5').update(key).digest('hex').slice(0, 16);
}

function guessCategory(title) {
  var t = title.toLowerCase();
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
  var avg = (minP && maxP) ? (minP + maxP) / 2 : (minP || maxP);
  if (!avg) return null;
  if (avg < 15) return 'budget';
  if (avg < 40) return 'mid';
  if (avg < 100) return 'premium';
  return 'luxury';
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

(async function main() {
  try {
    console.log('[v0] Fetching CSV...');
    var res = await fetch('https://blobs.vusercontent.net/blob/Produkte%20und%20Marken%2C%20die%20Kunden%20auf%20Google%20kaufen_2026-02-22_20_55_48-Usz9zwHRsTcowOdzwIyMHr25EhXKBt.csv');
    var raw = await res.text();
    var lines = raw.split('\n').filter(function(l) { return l.trim().length > 0; });
    var dataLines = lines.slice(3);
    console.log('[v0] Data rows: ' + dataLines.length);

    // Build ALL value tuples, deduplicating by product_hash
    var seenHashes = {};
    var allValues = [];
    var skipped = 0;
    var dupes = 0;
    for (var i = 0; i < dataLines.length; i++) {
      var fields = parseCSVLine(dataLines[i]);
      if (fields.length < 4) { skipped++; continue; }
      var title = fields[1];
      var brand = fields[2];
      if (!title || title === 'Titel') { skipped++; continue; }
      var rank = parseInt(fields[0], 10);
      var minPrice = fields[4] ? parseFloat(fields[4]) : null;
      var maxPrice = fields[5] ? parseFloat(fields[5]) : null;
      var currency = fields[6];
      var ph = makeHash(title, brand);

      // Skip duplicates within the CSV
      if (seenHashes[ph]) { dupes++; continue; }
      seenHashes[ph] = true;

      var cat = guessCategory(title);
      var tier = priceTier(minPrice, maxPrice);

      allValues.push('(' + [
        esc(ph), esc(title), esc(brand || null), esc(cat), esc(tier),
        maxPrice !== null ? maxPrice : 'NULL',
        minPrice !== null ? minPrice : 'NULL',
        esc(currency || 'EUR'), esc('google_suggestion'), esc('research'),
        esc(fields[3] || null), esc('google_rank_' + rank), 'NOW()', 'NOW()'
      ].join(',') + ')');
    }
    console.log('[v0] Parsed ' + allValues.length + ' unique products, skipped ' + skipped + ', dupes ' + dupes);

    // Insert in large batches of 500 using sql.query (only ~15 network calls)
    var BATCH = 500;
    var imported = 0;
    var errors = 0;
    var prefix = 'INSERT INTO product_catalog (product_hash,display_name,brand,category,price_tier,price_original,retail_price,price_currency,source,status,review_signals,acquisition_lead,created_at,updated_at) VALUES ';
    var suffix = ' ON CONFLICT (product_hash) DO UPDATE SET review_signals=EXCLUDED.review_signals,acquisition_lead=EXCLUDED.acquisition_lead,price_original=COALESCE(EXCLUDED.price_original,product_catalog.price_original),retail_price=COALESCE(EXCLUDED.retail_price,product_catalog.retail_price),updated_at=NOW()';

    for (var b = 0; b < allValues.length; b += BATCH) {
      var chunk = allValues.slice(b, b + BATCH);
      try {
        await sql.query(prefix + chunk.join(',') + suffix);
        imported += chunk.length;
        console.log('[v0] Batch ' + Math.floor(b / BATCH + 1) + ': inserted ' + chunk.length + ' (total: ' + imported + ')');
      } catch (e) {
        errors += chunk.length;
        console.error('[v0] Batch error at ' + b + ': ' + e.message.substring(0, 200));
      }
    }

    console.log('[v0] DONE: imported=' + imported + ', skipped=' + skipped + ', errors=' + errors);
  } catch (e) {
    console.error('[v0] Fatal: ' + e.message);
  }
})();
