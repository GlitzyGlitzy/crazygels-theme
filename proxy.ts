import { NextResponse, type NextRequest } from 'next/server';

/**
 * proxy.ts (Next.js 16 — replaces middleware.ts)
 * Last updated: 2026-03-10
 *
 * 1. Blocks known bots, scrapers, and suspicious traffic
 * 2. Catches ALL old Shopify locale-prefix URLs and 301-redirects without prefix
 * 3. Flattens Shopify collection-nested product URLs
 */

// ── Bot Protection ──────────────────────────────────────────────────────────

// Known malicious bot / scraper user-agent keywords (lowercase)
const BLOCKED_UA_KEYWORDS = [
  'semrush', 'ahrefs', 'dotbot', 'mj12bot', 'blexbot', 'seekport',
  'megaindex', 'serpstat', 'dataforseo', 'zoominfobot', 'censys',
  'netcrawl', 'scanning', 'masscan', 'zgrab', 'httpclient',
  'python-requests', 'python-urllib', 'go-http-client', 'java/',
  'libwww-perl', 'wget', 'curl/', 'scrapy', 'headlesschrome',
  'phantomjs', 'selenium', 'puppeteer', 'nightmare', 'sqlmap',
  'nikto', 'nmap', 'dirbuster', 'gobuster', 'nuclei', 'httpx',
  'petalbot', 'bytespider', 'bytedance', 'yandexbot', 'baiduspider',
  'sogou', 'exabot', 'ahc/', 'cf-browser', 'coccocbot',
];

// Paths that bots commonly probe (vulnerability scanners)
const BLOCKED_PATHS = [
  '/wp-admin', '/wp-login', '/wp-content', '/wp-includes',
  '/xmlrpc.php', '/.env', '/.git', '/phpmyadmin',
  '/admin.php', '/administrator', '/config.php',
  '/vendor/', '/node_modules/', '/debug/', '/test/',
  '/.well-known/security.txt',
];

// File extensions bots scan for
const BLOCKED_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.cgi', '.sql', '.bak', '.old',
  '.log', '.ini', '.conf', '.yml', '.yaml', '.toml', '.sh', '.bash',
];

function isBlockedBot(request: NextRequest): boolean {
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const { pathname } = request.nextUrl;
  const pathLower = pathname.toLowerCase();

  // 1. Block empty user-agents (almost always bots)
  if (!ua || ua.length < 10) return true;

  // 2. Block known bad user-agent keywords
  if (BLOCKED_UA_KEYWORDS.some((kw) => ua.includes(kw))) return true;

  // 3. Block probes to common vulnerability paths
  if (BLOCKED_PATHS.some((p) => pathLower.startsWith(p))) return true;

  // 4. Block requests for non-web file extensions
  if (BLOCKED_EXTENSIONS.some((ext) => pathLower.endsWith(ext))) return true;

  // 5. Block requests with no accept header (most real browsers send one)
  const accept = request.headers.get('accept');
  if (!accept && request.method === 'GET') return true;

  return false;
}

// ── Locale Handling ─────────────────────────────────────────────────────────

// All known Shopify locale prefixes (2-letter ISO 639-1 codes + regional variants)
const SHOPIFY_LOCALE_PREFIXES = new Set([
  'en', 'de', 'fr', 'fi', 'it', 'es', 'nl', 'ja', 'ko', 'pt', 'sv',
  'da', 'pl', 'cs', 'th', 'zh', 'ar', 'bg', 'ca', 'el', 'et', 'he',
  'hi', 'hr', 'hu', 'id', 'lt', 'lv', 'ms', 'nb', 'nn', 'ro', 'ru',
  'sk', 'sl', 'sr', 'tr', 'uk', 'vi',
  // Missing locale codes found in Google Search Console 404s
  'no', 'ga', 'ka', 'eu', 'af', 'am', 'az', 'be', 'bn', 'bs', 'cy',
  'eo', 'fa', 'fy', 'gl', 'gu', 'ha', 'hy', 'is', 'jv', 'kk', 'km',
  'kn', 'ku', 'ky', 'lo', 'mg', 'mi', 'mk', 'ml', 'mn', 'mr', 'mt',
  'my', 'ne', 'or', 'pa', 'ps', 'rw', 'sd', 'si', 'so', 'sq', 'su',
  'sw', 'ta', 'te', 'tg', 'tl', 'ur', 'uz', 'yo', 'zu',
  // Regional variants Shopify uses
  'zh-cn', 'zh-tw', 'pt-br', 'pt-pt', 'en-gb', 'en-us', 'fr-ca',
  'es-mx', 'es-ar', 'en-au', 'en-ca', 'en-nz', 'en-ie', 'en-sg',
]);

export default function proxy(request: NextRequest) {
  // ── 0. Bot protection ──
  if (isBlockedBot(request)) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { pathname } = request.nextUrl;
  const url = request.nextUrl.clone();

  // ── 1. Strip locale prefixes (handles double-locale like /no/no/products/...) ──
  let cleanPath = pathname;
  let localeStripped = false;

  // Keep stripping locale prefixes until none remain (handles /no/no/... , /da/en/... etc.)
  let safetyCounter = 0;
  while (safetyCounter < 3) {
    const localeMatch = cleanPath.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/(.*))?$/i);
    if (!localeMatch) break;

    const prefix = localeMatch[1]!.toLowerCase();
    if (!SHOPIFY_LOCALE_PREFIXES.has(prefix)) break;

    cleanPath = localeMatch[2] ? `/${localeMatch[2]}` : '/';
    localeStripped = true;
    safetyCounter++;
  }

  // ── 2. Flatten Shopify collection-nested product URLs ──
  // /collections/:collection/products/:handle -> /products/:handle
  const collectionProductMatch = cleanPath.match(/^\/collections\/[^/]+\/products\/(.+)$/i);
  if (collectionProductMatch) {
    cleanPath = `/products/${collectionProductMatch[1]}`;
    url.pathname = cleanPath;
    return NextResponse.redirect(url, 301);
  }

  // ── 3. Redirect if locale was stripped ──
  if (localeStripped) {
    url.pathname = cleanPath;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.jpg|og-image.jpg|images|sitemap.xml|robots.txt).*)',
  ],
};
