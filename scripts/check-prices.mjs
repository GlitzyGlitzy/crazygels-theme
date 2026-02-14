import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  await client.connect();

  // 1. Check enrichment table columns
  const cols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_enrichment' ORDER BY ordinal_position`);
  console.log("\n=== product_enrichment columns ===");
  cols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // 2. Check catalog table columns
  const catCols = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_catalog' ORDER BY ordinal_position`);
  console.log("\n=== product_catalog columns ===");
  catCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // 3. Check overpriced products - what's stored vs displayed
  const overpriced = await client.query(`
    SELECT shopify_title, shopify_price, competitor_price_avg, price_position, catalog_display_name
    FROM product_enrichment 
    WHERE price_position = 'overpriced' 
    ORDER BY shopify_title 
    LIMIT 15
  `);
  console.log("\n=== Overpriced products (DB values) ===");
  overpriced.rows.forEach(r => {
    console.log(`  "${r.shopify_title}" | Your price: ${r.shopify_price} | Competitor avg: ${r.competitor_price_avg} | Matched: ${r.catalog_display_name}`);
  });

  // 4. Check if catalog has retail prices
  const catPrices = await client.query(`
    SELECT display_name, price_tier, 
      CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_catalog' AND column_name='retail_price') 
        THEN 'has retail_price column' 
        ELSE 'NO retail_price column' 
      END as has_price
    FROM product_catalog LIMIT 10
  `);
  console.log("\n=== Catalog products (price data) ===");
  catPrices.rows.forEach(r => console.log(`  "${r.display_name}" | tier: ${r.price_tier} | ${r.has_price}`));

  // 5. Check price_history table if it exists
  try {
    const histCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'price_history' ORDER BY ordinal_position`);
    if (histCols.rows.length > 0) {
      console.log("\n=== price_history columns ===");
      histCols.rows.forEach(r => console.log(`  ${r.column_name}`));
      const hist = await client.query(`SELECT * FROM price_history LIMIT 5`);
      console.log("\n=== price_history sample ===");
      hist.rows.forEach(r => console.log(`  `, JSON.stringify(r)));
    }
  } catch(e) {
    console.log("\n=== No price_history table ===");
  }

  // 6. Check all tables in the database
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`);
  console.log("\n=== All tables ===");
  tables.rows.forEach(r => console.log(`  ${r.table_name}`));

  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
