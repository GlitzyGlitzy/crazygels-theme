import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle old Shopify locale-prefixed URLs.
 *
 * Shopify generated URLs like:
 *   /en/products/dewlit-gold
 *   /hu/products/time-to-unwind
 *   /fr/fi/products/anua-rice-enzyme-...
 *   /it/it/products/anua-2-bha-...
 *   /el/el/products/...
 *   /ga/products/...
 *   /fr/collections/all/products/...
 *
 * These need to be 301-redirected to the canonical (no-locale) version.
 */

// All ISO 639-1 two-letter locale codes that Shopify uses
const LOCALE_CODES = new Set([
  'aa','ab','af','ak','am','an','ar','as','av','ay','az',
  'ba','be','bg','bh','bi','bm','bn','bo','br','bs',
  'ca','ce','ch','co','cr','cs','cu','cv','cy',
  'da','de','dv','dz',
  'ee','el','en','eo','es','et','eu',
  'fa','ff','fi','fj','fo','fr','fy',
  'ga','gd','gl','gn','gu','gv',
  'ha','he','hi','ho','hr','ht','hu','hy','hz',
  'ia','id','ie','ig','ii','ik','io','is','it','iu',
  'ja','jv',
  'ka','kg','ki','kj','kk','kl','km','kn','ko','kr','ks','ku','kv','kw','ky',
  'la','lb','lg','li','ln','lo','lt','lu','lv',
  'mg','mh','mi','mk','ml','mn','mo','mr','ms','mt','my',
  'na','nb','nd','ne','ng','nl','nn','no','nr','nv','ny',
  'oc','oj','om','or','os',
  'pa','pi','pl','ps','pt',
  'qu',
  'rm','rn','ro','ru','rw',
  'sa','sc','sd','se','sg','sh','si','sk','sl','sm','sn','so','sq','sr','ss','st','su','sv','sw',
  'ta','te','tg','th','ti','tk','tl','tn','to','tr','ts','tt','tw','ty',
  'ug','uk','ur','uz',
  'va','ve','vi','vo',
  'wa','wo',
  'xh',
  'yi','yo',
  'za','zh','zu',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Split path into segments: /hu/products/foo → ['', 'hu', 'products', 'foo']
  const segments = pathname.split('/');

  // Check if the first segment (after leading /) is a locale code
  if (segments.length >= 2 && LOCALE_CODES.has(segments[1].toLowerCase())) {
    // Remove the locale prefix
    let remaining = segments.slice(2);

    // Handle double locale prefixes like /it/it/products/... or /el/el/products/...
    if (remaining.length >= 1 && LOCALE_CODES.has(remaining[0].toLowerCase())) {
      remaining = remaining.slice(1);
    }

    // Handle /fr/collections/all/products/... → /products/...
    if (remaining[0] === 'collections' && remaining[1] === 'all' && remaining[2] === 'products') {
      remaining = remaining.slice(2); // keep /products/...
    }
    // Handle /fr/collections/:name/products/:handle → /products/:handle
    else if (remaining[0] === 'collections' && remaining.length >= 3 && remaining[2] === 'products') {
      remaining = remaining.slice(2); // keep /products/...
    }

    const newPath = '/' + remaining.join('/') || '/';

    // Don't redirect if the path is unchanged (avoid loop)
    if (newPath !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Only run on paths that START with a 2-letter segment
  // This avoids running middleware on /products/..., /api/..., etc.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|fonts|scripts).*)',
  ],
};
