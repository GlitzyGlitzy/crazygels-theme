const { neon } = require('@neondatabase/serverless');
var sql = neon(process.env.DATABASE_URL);

async function run() {
  try {
    var result = await sql`SELECT COUNT(*)::int AS cnt FROM product_catalog`;
    console.log('[v0] Current count: ' + JSON.stringify(result));
  } catch(e) {
    console.error('[v0] Error: ' + e.message);
  }
}
run();
