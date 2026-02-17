/**
 * CrazyGels Product Scraper v3 -- REAL DATA ONLY
 *
 * 2-stage pipeline:
 *   Stage 1: Product discovery from Open Beauty Facts (names, brands, ingredients, images, barcodes)
 *   Stage 2: Price enrichment from Google Shopping DE (real EUR prices from German retailers)
 *
 * Usage:
 *   node scripts/scrape-all.mjs                          # Full pipeline (discovery + prices)
 *   node scripts/scrape-all.mjs --stage discover          # Stage 1 only (OBF products)
 *   node scripts/scrape-all.mjs --stage prices            # Stage 2 only (enrich existing products)
 *   node scripts/scrape-all.mjs --brands cerave,nuxe      # Filter by brands
 *   node scripts/scrape-all.mjs --dry-run                 # Preview without DB writes
 *   node scripts/scrape-all.mjs --limit 50                # Limit products per category
 *
 * IMPORTANT: This scraper NEVER fabricates prices. If a price cannot be found, it stays NULL.
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";

// ── Load .env.local ──────────────────────────────────────────────────
try {
  const envFile = readFileSync(".env.local", "utf-8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error("WARNING: Could not read .env.local -- make sure it exists");
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL not set. Run: npx vercel env pull .env.local");
  process.exit(1);
}

// ── CLI args ─────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const stageArg = getArg("stage"); // "discover" | "prices" | null (both)
const brandsArg = getArg("brands"); // "cerave,nuxe,..." | null
const limitArg = parseInt(getArg("limit") || "80", 10);
const dryRun = args.includes("--dry-run");

// ── Helpers ──────────────────────────────────────────────────────────
function hash(str) {
  return createHash("sha256").update(str.toLowerCase().trim()).digest("hex").slice(0, 16);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function priceTier(priceEur) {
  if (!priceEur || priceEur <= 0) return "unknown";
  if (priceEur > 80) return "luxury";
  if (priceEur > 40) return "premium";
  if (priceEur > 15) return "mid";
  return "budget";
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
};

// ── Brands to scrape ─────────────────────────────────────────────────
const DEFAULT_BRANDS = [
  // Skincare
  "cerave", "la roche-posay", "the ordinary", "paula's choice", "neutrogena",
  "eucerin", "bioderma", "avene", "nuxe", "caudalie", "vichy",
  "clinique", "kiehl's", "olay", "nivea", "garnier",
  // K-Beauty
  "cosrx", "some by mi", "beauty of joseon", "purito", "anua",
  "isntree", "torriden", "round lab", "klairs", "missha", "innisfree",
  "dr. jart+", "laneige", "banila co", "skin1004", "medicube",
  // Premium
  "drunk elephant", "tatcha", "sunday riley", "fresh", "origins",
  "glow recipe", "summer fridays", "farmacy", "biossance",
  "skinceuticals", "dermalogica", "murad",
  // Haircare
  "olaplex", "moroccanoil", "kerastase", "redken", "shea moisture",
  "briogeo", "ouai", "amika", "living proof", "ogx",
  // Body / Sun
  "sol de janeiro", "supergoop", "la roche posay", "eltamd", "isdin",
  // Fragrance
  "dior", "chanel", "ysl", "tom ford", "jo malone", "byredo",
];

const BRANDS = brandsArg
  ? brandsArg.split(",").map((b) => b.trim().toLowerCase())
  : DEFAULT_BRANDS;

// ── OBF Categories ───────────────────────────────────────────────────
const OBF_CATEGORIES = [
  "moisturizers", "serums", "cleansers", "sunscreens", "face-masks",
  "eye-creams", "toners", "exfoliators", "shampoos", "conditioners",
  "hair-masks", "body-lotions", "hand-creams", "lip-balms",
];

// ══════════════════════════════════════════════════════════════════════
// STAGE 1: PRODUCT DISCOVERY (Open Beauty Facts)
// ══════════════════════════════════════════════════════════════════════

async function discoverProducts() {
  const products = [];
  console.log(`\n[STAGE 1] Product Discovery via Open Beauty Facts`);
  console.log(`  Brands: ${BRANDS.length} | Categories: ${OBF_CATEGORIES.length} | Limit: ${limitArg}/category`);

  // 1a. Search by brand
  console.log(`\n  --- Brand search ---`);
  for (const brand of BRANDS) {
    const url = `https://world.openbeautyfacts.org/api/v2/search?brands=${encodeURIComponent(brand)}&fields=code,product_name,brands,categories,image_front_url,ingredients_text,quantity,labels&page_size=${limitArg}`;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        console.log(`  [OBF] ${brand}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = data.products || [];
      let added = 0;

      for (const p of items) {
        const parsed = parseOBFProduct(p, "brand_search");
        if (parsed) {
          products.push(parsed);
          added++;
        }
      }
      console.log(`  [OBF] ${brand}: ${added} products`);
    } catch (err) {
      console.log(`  [OBF] ${brand}: error - ${err.message}`);
    }
    await sleep(300); // Polite rate limit
  }

  // 1b. Search by category
  console.log(`\n  --- Category search ---`);
  for (const cat of OBF_CATEGORIES) {
    const url = `https://world.openbeautyfacts.org/api/v2/search?categories_tags=${encodeURIComponent(cat)}&fields=code,product_name,brands,categories,image_front_url,ingredients_text,quantity,labels&page_size=${limitArg}`;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        console.log(`  [OBF] ${cat}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = data.products || [];
      let added = 0;

      for (const p of items) {
        const parsed = parseOBFProduct(p, "category_search");
        if (parsed && !products.find((x) => x.product_hash === parsed.product_hash)) {
          products.push(parsed);
          added++;
        }
      }
      console.log(`  [OBF] ${cat}: ${added} new products`);
    } catch (err) {
      console.log(`  [OBF] ${cat}: error - ${err.message}`);
    }
    await sleep(300);
  }

  return products;
}

function parseOBFProduct(p, searchType) {
  const name = p.product_name?.trim();
  const brand = p.brands?.split(",")[0]?.trim();
  if (!name || name.length < 3) return null;

  const barcode = p.code || null;
  const productHash = hash(`obf:${barcode || name}:${brand || ""}`);

  // Determine category from OBF categories string
  const obfCats = (p.categories || "").toLowerCase();
  let category = "skincare";
  if (obfCats.includes("hair") || obfCats.includes("shampoo") || obfCats.includes("conditioner")) {
    category = "haircare";
  } else if (obfCats.includes("body") || obfCats.includes("lotion")) {
    category = "body_care";
  } else if (obfCats.includes("lip") || obfCats.includes("makeup") || obfCats.includes("foundation")) {
    category = "makeup";
  } else if (obfCats.includes("sun") || obfCats.includes("spf")) {
    category = "suncare";
  } else if (obfCats.includes("fragrance") || obfCats.includes("perfume") || obfCats.includes("parfum")) {
    category = "fragrances";
  }

  return {
    product_hash: productHash,
    source: "open_beauty_facts",
    external_id: barcode || productHash,
    barcode,
    name: name.slice(0, 255),
    brand: brand || null,
    category,
    product_type: category.replace(/_/g, " "),
    // NO PRICE -- OBF does not have price data, we never fake it
    price_original: null,
    price_currency: null,
    sale_price: null,
    price_eur: null,
    price_tier: "unknown",
    image_url: p.image_front_url || null,
    source_url: barcode ? `https://world.openbeautyfacts.org/product/${barcode}` : null,
    description: null,
    ingredients: p.ingredients_text || null,
    size: p.quantity || null,
    rating: null,
    review_count: null,
    labels: p.labels || null,
    search_type: searchType,
  };
}

// ══════════════════════════════════════════════════════════════════════
// STAGE 2: PRICE ENRICHMENT (Google Shopping DE)
// ══════════════════════════════════════════════════════════════════════

/**
 * Scrape Google Shopping DE for real prices.
 * Google Shopping returns HTML with structured price data.
 * We parse the response to extract price, retailer, and product URL.
 */
async function enrichPrices(products) {
  console.log(`\n[STAGE 2] Price Enrichment via Google Shopping DE`);
  console.log(`  Products to price: ${products.length}`);

  let found = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    // Skip products that already have a real price
    if (p.price_eur && p.price_eur > 0) {
      found++;
      continue;
    }

    // Build search query: "brand + product name"
    const searchQuery = [p.brand, p.name]
      .filter(Boolean)
      .join(" ")
      .replace(/[^\w\s\-äöüÄÖÜß]/g, "")
      .slice(0, 120);

    if (!searchQuery || searchQuery.length < 5) {
      notFound++;
      continue;
    }

    try {
      const price = await scrapeGoogleShoppingPrice(searchQuery);

      if (price && price.amount > 0) {
        p.price_eur = price.amount;
        p.price_currency = "EUR";
        p.price_tier = priceTier(price.amount);
        p.price_original = price.amount;
        if (price.url) p.source_url = price.url;
        if (price.retailer) p.retailer = price.retailer;
        found++;
      } else {
        notFound++;
      }
    } catch (err) {
      errors++;
      if (errors <= 5) {
        console.log(`  [PRICE] Error for "${searchQuery.slice(0, 40)}": ${err.message}`);
      }
    }

    // Progress log every 20 products
    if ((i + 1) % 20 === 0) {
      console.log(
        `  [PRICE] Progress: ${i + 1}/${products.length} | Found: ${found} | Not found: ${notFound} | Errors: ${errors}`
      );
    }

    // Rate limit: 2-4 seconds between requests (randomised to look natural)
    await sleep(2000 + Math.random() * 2000);
  }

  console.log(
    `  [PRICE] DONE: ${found} priced, ${notFound} not found, ${errors} errors`
  );
  return products;
}

/**
 * Scrape a single product price from Google Shopping DE.
 * Returns { amount: number, currency: string, retailer: string, url: string } or null.
 */
async function scrapeGoogleShoppingPrice(query) {
  const url = `https://www.google.de/search?tbm=shop&q=${encodeURIComponent(query)}&hl=de&gl=de`;

  const res = await fetch(url, {
    headers: {
      ...HEADERS,
      Referer: "https://www.google.de/",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    if (res.status === 429) {
      console.log("  [PRICE] Rate limited by Google, waiting 30s...");
      await sleep(30000);
      return null;
    }
    return null;
  }

  const html = await res.text();
  return parseGoogleShoppingHTML(html);
}

/**
 * Parse Google Shopping HTML to extract the first product price.
 * Google Shopping DE embeds prices in various formats.
 */
function parseGoogleShoppingHTML(html) {
  // Strategy 1: Look for price patterns in the shopping results
  // Google Shopping DE uses "XX,XX&nbsp;€" or "XX,XX €" format

  // Match prices like "12,99 €", "12,99&nbsp;€", "€12,99", "EUR 12,99"
  const pricePatterns = [
    // German format: "12,99 €" or "12,99&nbsp;€"
    /(\d{1,4}),(\d{2})\s*(?:&nbsp;)?€/g,
    // Euro sign before: "€ 12,99" or "€12,99"
    /€\s*(\d{1,4}),(\d{2})/g,
    // "EUR 12,99"
    /EUR\s*(\d{1,4}),(\d{2})/g,
    // data-price attribute
    /data-price="(\d+\.?\d*)"/g,
  ];

  const prices = [];

  for (const pattern of pricePatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let amount;
      if (match[0].includes("data-price")) {
        amount = parseFloat(match[1]);
      } else {
        amount = parseFloat(`${match[1]}.${match[2]}`);
      }
      // Sanity check: beauty products are typically 2-500 EUR
      if (amount >= 2 && amount <= 500) {
        prices.push(amount);
      }
    }
  }

  if (prices.length === 0) return null;

  // Take the median price to avoid outliers
  prices.sort((a, b) => a - b);
  const medianIdx = Math.floor(prices.length / 2);
  const amount = Math.round(prices[medianIdx] * 100) / 100;

  // Try to extract retailer name
  let retailer = null;
  const retailerMatch = html.match(
    /(?:von|bei|from)\s+<[^>]*>([^<]+)<\/(?:span|a|div)>/i
  );
  if (retailerMatch) {
    retailer = retailerMatch[1].trim();
  }

  // Try to extract product URL
  let productUrl = null;
  const urlMatch = html.match(
    /href="\/url\?q=(https?:\/\/(?:www\.)?(?:douglas|notino|flaconi|parfumdreams|shop-apotheke|amazon)[^"&]+)/i
  );
  if (urlMatch) {
    productUrl = decodeURIComponent(urlMatch[1]);
  }

  return {
    amount,
    currency: "EUR",
    retailer,
    url: productUrl,
  };
}

// ══════════════════════════════════════════════════════════════════════
// DATABASE WRITER
// ══════════════════════════════════════════════════════════════════════

async function writeToDatabase(products) {
  if (dryRun) {
    console.log(`\n[DRY RUN] Would write ${products.length} products to DB. Skipping.`);
    const withPrice = products.filter((p) => p.price_eur > 0).length;
    const withImage = products.filter((p) => p.image_url).length;
    const withIngredients = products.filter((p) => p.ingredients).length;
    console.log(`  With real prices: ${withPrice}`);
    console.log(`  With images: ${withImage}`);
    console.log(`  With ingredients: ${withIngredients}`);

    // Show a sample of priced products
    const sampled = products.filter((p) => p.price_eur > 0).slice(0, 10);
    if (sampled.length > 0) {
      console.log(`\n  Sample priced products:`);
      for (const s of sampled) {
        console.log(`    ${s.brand || "?"} - ${s.name?.slice(0, 50)} = ${s.price_eur} EUR (${s.price_tier})`);
      }
    }
    return;
  }

  const postgresModule = await import("postgres");
  const sql = postgresModule.default(DATABASE_URL, { ssl: "require" });

  let stagingCount = 0;
  let catalogCount = 0;
  let errorCount = 0;

  const batchSize = 50;
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(products.length / batchSize);

    for (const p of batch) {
      try {
        // 1. Write to scrape_staging (raw data)
        await sql`
          INSERT INTO scrape_staging
            (product_hash, source, external_id, name, brand, category, product_type,
             price_original, price_currency, sale_price, price_eur, price_tier,
             image_url, source_url, description, ingredients, size,
             rating, review_count, status, scraped_at, created_at, updated_at)
          VALUES (${p.product_hash}, ${p.source}, ${p.external_id}, ${p.name}, ${p.brand},
                  ${p.category}, ${p.product_type}, ${p.price_original}, ${p.price_currency},
                  ${p.sale_price}, ${p.price_eur}, ${p.price_tier}, ${p.image_url},
                  ${p.source_url}, ${p.description}, ${p.ingredients}, ${p.size},
                  ${p.rating}, ${p.review_count}, 'new', NOW(), NOW(), NOW())
          ON CONFLICT (product_hash) DO UPDATE SET
            price_original = COALESCE(EXCLUDED.price_original, scrape_staging.price_original),
            price_eur = COALESCE(EXCLUDED.price_eur, scrape_staging.price_eur),
            price_currency = COALESCE(EXCLUDED.price_currency, scrape_staging.price_currency),
            price_tier = CASE
              WHEN EXCLUDED.price_tier != 'unknown' THEN EXCLUDED.price_tier
              ELSE scrape_staging.price_tier
            END,
            image_url = COALESCE(EXCLUDED.image_url, scrape_staging.image_url),
            source_url = COALESCE(EXCLUDED.source_url, scrape_staging.source_url),
            description = COALESCE(EXCLUDED.description, scrape_staging.description),
            ingredients = COALESCE(EXCLUDED.ingredients, scrape_staging.ingredients),
            rating = COALESCE(EXCLUDED.rating, scrape_staging.rating),
            updated_at = NOW()
        `;
        stagingCount++;

        // 2. Promote to product_catalog (only with real data)
        const retailPrice = p.price_eur && p.price_eur > 0 ? p.price_eur : null;
        const currency = retailPrice ? "EUR" : null;

        await sql`
          INSERT INTO product_catalog
            (product_hash, display_name, category, product_type, price_tier,
             retail_price, currency, image_url, description_generated,
             source_url, brand, source, price_original, price_currency,
             status, created_at, updated_at)
          VALUES (${p.product_hash}, ${p.name}, ${p.category}, ${p.product_type}, ${p.price_tier},
                  ${retailPrice}, ${currency}, ${p.image_url}, ${p.description},
                  ${p.source_url}, ${p.brand}, ${p.source}, ${p.price_original}, ${p.price_currency},
                  'research', NOW(), NOW())
          ON CONFLICT (product_hash) DO UPDATE SET
            display_name = COALESCE(EXCLUDED.display_name, product_catalog.display_name),
            retail_price = COALESCE(EXCLUDED.retail_price, product_catalog.retail_price),
            currency = COALESCE(EXCLUDED.currency, product_catalog.currency),
            image_url = COALESCE(EXCLUDED.image_url, product_catalog.image_url),
            description_generated = COALESCE(EXCLUDED.description_generated, product_catalog.description_generated),
            source_url = COALESCE(EXCLUDED.source_url, product_catalog.source_url),
            brand = COALESCE(EXCLUDED.brand, product_catalog.brand),
            price_original = COALESCE(EXCLUDED.price_original, product_catalog.price_original),
            price_currency = COALESCE(EXCLUDED.price_currency, product_catalog.price_currency),
            price_tier = CASE
              WHEN EXCLUDED.price_tier != 'unknown' THEN EXCLUDED.price_tier
              ELSE product_catalog.price_tier
            END,
            updated_at = NOW()
        `;
        catalogCount++;
      } catch (err) {
        errorCount++;
        if (errorCount <= 5) {
          console.log(`  [DB] Error on ${p.name?.slice(0, 40)}: ${err.message?.slice(0, 100)}`);
        }
      }
    }
    process.stdout.write(
      `\r  [DB] Batch ${batchNum}/${totalBatches} -- staging: ${stagingCount}, catalog: ${catalogCount}, errors: ${errorCount}`
    );
  }

  await sql.end();
  console.log(
    `\n  [DB] DONE: ${stagingCount} staging, ${catalogCount} catalog, ${errorCount} errors`
  );
}

// ══════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════

async function main() {
  console.log("=== CrazyGels Product Scraper v3 (Real Data Only) ===");
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Brands: ${BRANDS.length}`);
  if (stageArg) console.log(`Stage: ${stageArg}`);

  let products = [];

  // Stage 1: Product Discovery
  if (!stageArg || stageArg === "discover") {
    products = await discoverProducts();
    console.log(`\n[STAGE 1 DONE] ${products.length} products discovered`);
    console.log(`  With images: ${products.filter((p) => p.image_url).length}`);
    console.log(`  With ingredients: ${products.filter((p) => p.ingredients).length}`);
    console.log(`  With barcodes: ${products.filter((p) => p.barcode).length}`);
  }

  // If prices-only stage, load existing products from DB that lack prices
  if (stageArg === "prices") {
    console.log(`\n[STAGE 2] Loading products without prices from DB...`);
    const postgresModule = await import("postgres");
    const sql = postgresModule.default(DATABASE_URL, { ssl: "require" });

    const rows = await sql`
      SELECT product_hash, display_name as name, brand, category, product_type,
             image_url, source_url, ingredients
      FROM product_catalog
      WHERE (retail_price IS NULL OR retail_price = 0)
      ORDER BY updated_at DESC
      LIMIT 500
    `;
    await sql.end();

    products = rows.map((r) => ({
      ...r,
      source: "price_enrichment",
      external_id: r.product_hash,
      price_original: null,
      price_currency: null,
      sale_price: null,
      price_eur: null,
      price_tier: "unknown",
    }));
    console.log(`  Loaded ${products.length} products to price`);
  }

  // Stage 2: Price Enrichment
  if (!stageArg || stageArg === "prices") {
    products = await enrichPrices(products);
  }

  // Deduplicate
  const seen = new Set();
  const unique = [];
  for (const p of products) {
    if (!seen.has(p.product_hash)) {
      seen.add(p.product_hash);
      unique.push(p);
    }
  }

  // Final summary
  const withPrice = unique.filter((p) => p.price_eur && p.price_eur > 0).length;
  const withImage = unique.filter((p) => p.image_url).length;
  const withIngredients = unique.filter((p) => p.ingredients).length;
  const uniquePrices = new Set(unique.filter((p) => p.price_eur > 0).map((p) => p.price_eur)).size;

  console.log(`\n=== FINAL SUMMARY ===`);
  console.log(`Total unique products: ${unique.length}`);
  console.log(`With REAL prices: ${withPrice} (${unique.length ? Math.round((withPrice / unique.length) * 100) : 0}%)`);
  console.log(`Unique price points: ${uniquePrices}`);
  console.log(`With images: ${withImage}`);
  console.log(`With ingredients: ${withIngredients}`);
  console.log(`Sources: ${[...new Set(unique.map((p) => p.source))].join(", ")}`);

  if (withPrice > 0 && uniquePrices < 10) {
    console.log(
      `\nWARNING: Only ${uniquePrices} unique prices found -- this may indicate price scraping issues.`
    );
  }

  // Write to DB
  await writeToDatabase(unique);

  console.log("\nDone!");
}

main().catch(console.error);
