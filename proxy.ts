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
  // Regional variants Shopify uses
  'zh-cn', 'zh-tw', 'pt-br', 'pt-pt', 'en-gb', 'en-us', 'fr-ca',
  'es-mx', 'es-ar', 'en-au', 'en-ca', 'en-nz', 'en-ie', 'en-sg',
]);

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Match paths starting with a potential locale prefix: /xx or /xx-xx
  const localeMatch = pathname.match(/^\/([a-z]{2}(?:-[a-z]{2})?)(?:\/(.*))?$/i);

  if (localeMatch) {
    const prefix = localeMatch[1]!.toLowerCase();
    const rest = localeMatch[2] || '';

    if (SHOPIFY_LOCALE_PREFIXES.has(prefix)) {
      const destination = rest ? `/${rest}` : '/';
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.jpg|og-image.jpg|images|sitemap.xml|robots.txt).*)',
  ],
};
