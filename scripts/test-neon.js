try {
  const { neon } = require('@neondatabase/serverless');
  console.log('[v0] neon package loaded OK');
  console.log('[v0] DATABASE_URL set:', !!process.env.DATABASE_URL);
} catch (e) {
  console.error('[v0] Error:', e.message);
}
