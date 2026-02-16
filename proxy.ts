import { NextResponse, type NextRequest } from 'next/server';

/**
 * Proxy that catches ALL old Shopify locale-prefix URLs and strips the prefix.
 *
 * Shopify stores can have 20+ locale prefixes like /en, /de, /fr, /fi, /it, /es, /nl,
 * /ja, /ko, /pt, /sv, /da, /pl, /cs, /th, /zh-CN, /zh-TW, etc.
 *
 * Instead of adding individual redirect rules for each locale in next.config.mjs,
 * this proxy uses a regex to match all 2-letter and xx-XX locale prefixes
 * and issues a single 301 redirect to the path without the prefix.
 *
 * This preserves all Google Search Console traffic from old Shopify locale URLs.
 */

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
