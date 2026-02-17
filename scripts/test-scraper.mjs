/**
 * Quick test: run the scraper pipeline on 2 brands in dry-run mode
 * to verify OBF discovery + Google Shopping price enrichment work.
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";

// Load env
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
} catch { /* ignore */ }

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Test 1: OBF Product Discovery ────────────────────────────────────
async function testOBF() {
  console.log("=== TEST 1: Open Beauty Facts Discovery ===\n");
  
  const brands = ["cerave", "the ordinary"];
  
  for (const brand of brands) {
    const url = `https://world.openbeautyfacts.org/api/v2/search?brands=${encodeURIComponent(brand)}&fields=code,product_name,brands,categories,image_front_url,ingredients_text,quantity&page_size=5`;
    
    try {
      const res = await fetch(url, { headers: HEADERS });
      const data = await res.json();
      const items = data.products || [];
      
      console.log(`[OBF] "${brand}": ${items.length} products found`);
      for (const p of items.slice(0, 3)) {
        console.log(`  - ${p.product_name || "??"}`);
        console.log(`    Brand: ${p.brands || "unknown"}`);
        console.log(`    Image: ${p.image_front_url ? "YES" : "NO"}`);
        console.log(`    Ingredients: ${p.ingredients_text ? `YES (${p.ingredients_text.length} chars)` : "NO"}`);
        console.log(`    Barcode: ${p.code || "none"}`);
      }
      console.log("");
    } catch (err) {
      console.log(`[OBF] ${brand}: ERROR - ${err.message}\n`);
    }
    await sleep(300);
  }
}

// ── Test 2: Google Shopping DE Price Scrape ───────────────────────────
async function testGoogleShopping() {
  console.log("=== TEST 2: Google Shopping DE Prices ===\n");
  
  const queries = [
    "CeraVe Feuchtigkeitscreme",
    "The Ordinary Niacinamide 10%",
    "La Roche-Posay Effaclar Duo+",
    "Olaplex No. 3",
  ];
  
  for (const query of queries) {
    const url = `https://www.google.de/search?tbm=shop&q=${encodeURIComponent(query)}&hl=de&gl=de`;
    
    try {
      const res = await fetch(url, {
        headers: { ...HEADERS, Referer: "https://www.google.de/" },
        redirect: "follow",
      });
      
      if (!res.ok) {
        console.log(`[PRICE] "${query}": HTTP ${res.status}`);
        continue;
      }
      
      const html = await res.text();
      
      // Extract prices
      const prices = [];
      const patterns = [
        /(\d{1,4}),(\d{2})\s*(?:&nbsp;)?€/g,
        /€\s*(\d{1,4}),(\d{2})/g,
        /EUR\s*(\d{1,4}),(\d{2})/g,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const amount = parseFloat(`${match[1]}.${match[2]}`);
          if (amount >= 2 && amount <= 500) prices.push(amount);
        }
      }
      
      if (prices.length > 0) {
        prices.sort((a, b) => a - b);
        const median = prices[Math.floor(prices.length / 2)];
        console.log(`[PRICE] "${query}"`);
        console.log(`  Found ${prices.length} price(s): ${prices.slice(0, 5).map(p => p.toFixed(2) + " EUR").join(", ")}${prices.length > 5 ? "..." : ""}`);
        console.log(`  Median: ${median.toFixed(2)} EUR`);
      } else {
        console.log(`[PRICE] "${query}": No prices found in HTML (${html.length} chars)`);
        // Save HTML snippet for debugging
        const snippet = html.slice(0, 500);
        if (snippet.includes("captcha") || snippet.includes("unusual traffic")) {
          console.log(`  WARNING: Google may be showing a CAPTCHA`);
        }
      }
      console.log("");
    } catch (err) {
      console.log(`[PRICE] "${query}": ERROR - ${err.message}\n`);
    }
    
    await sleep(3000);
  }
}

// ── Run tests ────────────────────────────────────────────────────────
async function main() {
  console.log("CrazyGels Scraper Test\n");
  
  await testOBF();
  await testGoogleShopping();
  
  console.log("=== TEST COMPLETE ===");
}

main().catch(console.error);
