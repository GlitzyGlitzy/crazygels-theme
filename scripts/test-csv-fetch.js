const { neon } = require('@neondatabase/serverless');
const { createHash } = require('crypto');

async function main() {
  try {
    const csvUrl = 'https://blobs.vusercontent.net/blob/Produkte%20und%20Marken%2C%20die%20Kunden%20auf%20Google%20kaufen_2026-02-22_20_55_48-Usz9zwHRsTcowOdzwIyMHr25EhXKBt.csv';
    const res = await fetch(csvUrl);
    console.log('[v0] Fetch status:', res.status);
    const raw = await res.text();
    const lines = raw.split('\n').filter(l => l.trim());
    console.log('[v0] Total lines:', lines.length);
    console.log('[v0] Header:', lines[0].substring(0, 200));
    console.log('[v0] First data row:', lines[1].substring(0, 300));
    console.log('[v0] Second data row:', lines[2].substring(0, 300));
  } catch (err) {
    console.error('[v0] Error:', err.message);
  }
}

main();
