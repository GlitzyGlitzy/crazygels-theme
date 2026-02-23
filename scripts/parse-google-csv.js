const { createHash } = require('crypto');

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

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  var s = String(val).replace(/'/g, "''");
  return "'" + s + "'";
}

(async function main() {
  console.log('[v0] Fetching CSV...');
  var csvUrl = 'https://blobs.vusercontent.net/blob/Produkte%20und%20Marken%2C%20die%20Kunden%20auf%20Google%20kaufen_2026-02-22_20_55_48-Usz9zwHRsTcowOdzwIyMHr25EhXKBt.csv';
  var res = await fetch(csvUrl);
  var raw = await res.text();
  var lines = raw.split('\n').filter(function(l) { return l.trim().length > 0; });
  var dataLines = lines.slice(3);
  console.log('[v0] Rows: ' + dataLines.length);

  // Output first 200 rows as SQL for testing
  var count = 0;
  for (var i = 0; i < Math.min(dataLines.length, 200); i++) {
    var fields = parseCSVLine(dataLines[i]);
    if (fields.length < 4) continue;
    var title = fields[1];
    var brand = fields[2];
    if (!title || title === 'Titel') continue;
    var rank = parseInt(fields[0], 10);
    var minPrice = fields[4] ? parseFloat(fields[4]) : null;
    var maxPrice = fields[5] ? parseFloat(fields[5]) : null;
    var ph = makeHash(title, brand);
    var cat = guessCategory(title);
    var tier = priceTier(minPrice, maxPrice);
    console.log('ROW|' + ph + '|' + title.substring(0, 80) + '|' + (brand || '') + '|' + cat + '|' + (tier || '') + '|' + (maxPrice || '') + '|' + (minPrice || ''));
    count++;
  }
  console.log('[v0] Parsed ' + count + ' rows successfully');
})();
