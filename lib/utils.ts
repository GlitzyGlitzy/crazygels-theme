import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a price using the Shopify presentment currency.
 * Uses de-DE locale by default so prices render as "12,99 €" for European customers.
 * The currencyCode comes directly from the Storefront API response (presentment currency).
 */
export function formatPrice(amount: string, currencyCode: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

/**
 * Intelligently shorten a Shopify product title by removing redundant brand
 * prefixes, filler category words, and excessive separators while keeping the
 * core product name meaningful and readable.
 */
export function shortenProductTitle(title: string, maxLength = 50): string {
  if (!title) return title

  let t = title.trim()

  // 1. Strip the store brand if it leads the title
  const brandPrefixes = [
    'Crazy Gels',
    'CrazyGels',
    'Crazy Gels -',
    'Crazy Gels |',
    'CrazyGels -',
    'CrazyGels |',
    'Crazy Gels:',
    'CrazyGels:',
  ]
  for (const prefix of brandPrefixes) {
    if (t.toLowerCase().startsWith(prefix.toLowerCase())) {
      t = t.slice(prefix.length).trim()
      // Remove leading separator that might remain
      t = t.replace(/^[\s\-–—|:,]+/, '').trim()
      break
    }
  }

  // 2. Remove trailing filler phrases
  const trailingFillers = [
    /\s*[-–—|]\s*Crazy\s*Gels$/i,
    /\s*[-–—|]\s*by\s+Crazy\s*Gels$/i,
    /\s*[-–—|]\s*Free\s+Shipping$/i,
    /\s*[-–—|]\s*Best\s+Seller$/i,
    /\s*[-–—|]\s*New\s+Arrival$/i,
    /\s*[-–—|]\s*Limited\s+Edition$/i,
    /\s*[-–—|]\s*On\s+Sale$/i,
    /\s*[-–—|]\s*Hot\s+Sale$/i,
    /\s*\(\s*\d+\s*pack\s*\)$/i,
  ]
  for (const pattern of trailingFillers) {
    t = t.replace(pattern, '').trim()
  }

  // 3. Remove redundant leading category words that repeat what the collection already says
  const redundantLeaders = [
    /^(Semi[- ]?Cured\s+)?Gel\s+Nail\s+(Wraps?|Strips?|Stickers?)\s*[-–—|:]\s*/i,
    /^Nail\s+(Wraps?|Strips?|Stickers?|Art)\s*[-–—|:]\s*/i,
  ]
  for (const pattern of redundantLeaders) {
    t = t.replace(pattern, '').trim()
  }

  // 4. Collapse multiple separators / dashes into one
  t = t.replace(/\s*[-–—]{2,}\s*/g, ' - ')
  t = t.replace(/\s*[|]{2,}\s*/g, ' | ')

  // 5. Clean up double spaces and leading/trailing punctuation
  t = t.replace(/\s{2,}/g, ' ').trim()
  t = t.replace(/^[\s\-–—|:,]+|[\s\-–—|:,]+$/g, '').trim()

  // 6. If still too long, truncate at the last whole word before maxLength
  if (t.length > maxLength) {
    const truncated = t.slice(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    t = (lastSpace > maxLength * 0.4 ? truncated.slice(0, lastSpace) : truncated).trimEnd()
    // Remove trailing punctuation before ellipsis
    t = t.replace(/[\s\-–—|:,]+$/, '')
    t += '...'
  }

  return t
}
