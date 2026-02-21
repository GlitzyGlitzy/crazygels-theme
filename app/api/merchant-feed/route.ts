import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/shopify';
import { buildSeoTitle, buildSeoDescription } from '@/lib/seo';

/**
 * Google Merchant Centre Product Feed (XML)
 *
 * Serves a standard Google Shopping RSS 2.0 XML feed at:
 *   https://crazygels.com/api/merchant-feed
 *
 * All product links point to crazygels.com (not myshopify.com).
 * Includes all required + recommended Merchant Centre fields.
 *
 * To use:
 * 1. Go to Google Merchant Centre > Products and shop > Data sources
 * 2. Click "Add product source" > "Scheduled fetch"
 * 3. Enter URL: https://crazygels.com/api/merchant-feed
 * 4. Set fetch frequency to "Daily"
 * 5. Set time zone and save
 */

// Force dynamic rendering -- this feed fetches all products from Shopify
// and would time out during static build. Caching is handled via Cache-Control headers.
export const dynamic = 'force-dynamic';
// Allow up to 5 minutes for the feed to generate (many Shopify API calls)
export const maxDuration = 300;

const BASE_URL = 'https://crazygels.com';

// Google Product Category mappings
// Aligned to Google Merchant Center trending search topics for Crazy Gels:
// Skincare (85), Shampoo & Conditioner (19), Nail Polish (9),
// Moisturizing Creams (5), Artificial Nails (3), Toners (2), Conditioners (2)
const GOOGLE_CATEGORIES: Record<string, string> = {
  // Nails
  'gel nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  nails: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail accessories': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Manicure & Pedicure Tools',
  'nail polish': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Polish',
  'uv lamp': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  'uv light': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  'nail lamp': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  // Hair — Shampoo & Conditioner trending +3.7%
  'hair care': 'Health & Beauty > Personal Care > Hair Care',
  haircare: 'Health & Beauty > Personal Care > Hair Care',
  shampoo: 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner',
  conditioner: 'Health & Beauty > Personal Care > Hair Care > Shampoo & Conditioner',
  'hair extensions': 'Health & Beauty > Personal Care > Hair Care > Hair Extensions',
  'hair mask': 'Health & Beauty > Personal Care > Hair Care > Hair Treatments',
  // Skincare — trending +1.1%, highest volume
  skincare: 'Health & Beauty > Personal Care > Skin Care',
  'skin care': 'Health & Beauty > Personal Care > Skin Care',
  // Moisturizing creams — trending +5.4%
  'face cream': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  'moisturizer': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  'moisturizing cream': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  'night cream': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  'day cream': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  'jelly cream': 'Health & Beauty > Personal Care > Skin Care > Facial Moisturizers',
  // Toners & Essences — trending +5.9%
  toner: 'Health & Beauty > Personal Care > Skin Care > Toners & Astringents',
  essence: 'Health & Beauty > Personal Care > Skin Care > Toners & Astringents',
  'facial toner': 'Health & Beauty > Personal Care > Skin Care > Toners & Astringents',
  // Face masks
  'collagen masks': 'Health & Beauty > Personal Care > Skin Care > Facial Masks',
  'face mask': 'Health & Beauty > Personal Care > Skin Care > Facial Masks',
  'sheet mask': 'Health & Beauty > Personal Care > Skin Care > Facial Masks',
  // Treatments & tools
  treatments: 'Health & Beauty > Personal Care > Skin Care',
  serum: 'Health & Beauty > Personal Care > Skin Care > Facial Serums',
  accessories: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Nail Art Kits & Accessories',
};

// Default category for products that don't match
const DEFAULT_CATEGORY = 'Health & Beauty > Personal Care > Cosmetics';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getGoogleCategory(productType: string, title: string): string {
  const typeKey = productType.toLowerCase().trim();

  // Direct match on product type
  if (GOOGLE_CATEGORIES[typeKey]) {
    return GOOGLE_CATEGORIES[typeKey];
  }

  // Partial match on product type
  for (const [key, category] of Object.entries(GOOGLE_CATEGORIES)) {
    if (typeKey.includes(key) || key.includes(typeKey)) {
      return category;
    }
  }

  // Try matching on title
  const titleLower = title.toLowerCase();
  for (const [key, category] of Object.entries(GOOGLE_CATEGORIES)) {
    if (titleLower.includes(key)) {
      return category;
    }
  }

  return DEFAULT_CATEGORY;
}

function extractOption(
  selectedOptions: { name: string; value: string }[],
  ...names: string[]
): string | undefined {
  for (const opt of selectedOptions) {
    if (names.some((n) => opt.name.toLowerCase() === n.toLowerCase())) {
      return opt.value;
    }
  }
  return undefined;
}

export async function GET() {
  try {
    const products = await getAllProducts({});
    const items: string[] = [];

    // Diagnostic counters
    let totalProducts = products.length;
    let skippedNoHandle = 0;
    let skippedNoImage = 0;
    let skippedNoPrice = 0;
    let totalVariants = 0;

    for (const product of products) {
      const p = product;

      // Skip products without a valid handle or title (causes "Product page unavailable")
      if (!p.handle || !p.title) { skippedNoHandle++; continue; }

      // Skip products without images (causes "Missing product image" disapproval)
      const imageUrls = (p.images as unknown as { url: string }[])?.map?.((img) => img.url)
        || p.images?.edges?.map?.((e: { node: { url: string } }) => e.node.url)
        || [];
      const mainImage = imageUrls[0] || p.featuredImage?.url || '';
      if (!mainImage) { skippedNoImage++; continue; }

      const googleCategory = getGoogleCategory(p.productType || '', p.title);
      const description = stripHtml(p.description || p.title).slice(0, 5000);
      const seoTitle = buildSeoTitle(p.title, p.productType);
      const seoDescription = buildSeoDescription(
        p.title,
        p.description || '',
        p.productType,
        p.priceRange?.minVariantPrice
          ? `${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)} ${p.priceRange.minVariantPrice.currencyCode}`
          : ''
      );

      // Additional images (up to 10)
      const additionalImages = imageUrls.slice(1, 10);

      // MPN -- Shopify product ID
      const mpn = p.id?.split('/').pop() || p.handle;

      // Process each variant as a separate item (Google recommends this for variants)
      const variants = p.variants?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];

      for (const variant of variants) {
        const variantId = variant.id?.split('/').pop() || '';

        // ── Price resolution (fixes "Missing product price" for 185 products) ──
        // Try: variant price → product min price → product max price → 0
        const rawPrice = parseFloat(variant.price?.amount || '0');
        const fallbackMinPrice = parseFloat(p.priceRange?.minVariantPrice?.amount || '0');
        const fallbackMaxPrice = parseFloat(p.priceRange?.maxVariantPrice?.amount || '0');
        const finalPrice = rawPrice > 0 ? rawPrice : (fallbackMinPrice > 0 ? fallbackMinPrice : fallbackMaxPrice);
        const price = finalPrice.toFixed(2);
        const currency = variant.price?.currencyCode
          || p.priceRange?.minVariantPrice?.currencyCode
          || p.priceRange?.maxVariantPrice?.currencyCode
          || 'EUR';
        const compareAtPrice = variant.compareAtPrice?.amount
          ? parseFloat(variant.compareAtPrice.amount).toFixed(2)
          : '';

        // ── Availability (fixes "Missing value [availability]" for 33 products) ──
        // Explicit check: if variant says available, use that; otherwise fall back to product-level
        const isAvailable = typeof variant.availableForSale === 'boolean'
          ? variant.availableForSale
          : (typeof p.availableForSale === 'boolean' ? p.availableForSale : true);
        const variantImage = variant.image?.url || mainImage;

        // Extract variant attributes
        const selectedOptions = variant.selectedOptions || [];
        const color = extractOption(selectedOptions, 'color', 'colour', 'farbe');
        const size = extractOption(selectedOptions, 'size', 'größe', 'groesse');
        const material = extractOption(selectedOptions, 'material');
        const style = extractOption(selectedOptions, 'style', 'design', 'pattern', 'muster');

        // Build variant title
        const variantTitle =
          variant.title && variant.title !== 'Default Title'
            ? `${p.title} - ${variant.title}`
            : p.title;

        // Item group ID (same for all variants of one product)
        const itemGroupId = `shopify_${mpn}`;

        // If price is truly zero/missing, skip entirely -- Google requires a valid price
        if (!price || price === '0.00') { skippedNoPrice++; continue; }
        totalVariants++;

        // Unique ID per variant
        const uniqueId =
          variants.length > 1 ? `shopify_${mpn}_${variantId}` : `shopify_${mpn}`;

        // For sale_price: only include if compareAtPrice is HIGHER than the current price
        const hasSale = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);

        // Canonical link -- critical for Google to match feed items to live pages
        // Use clean URL for canonical (no query params) -- fixes "Mismatched domains"
        const productUrl = `${BASE_URL}/products/${p.handle}`;
        // Variant-specific link for multi-variant products
        const variantUrl = variants.length > 1 && variantId
          ? `${productUrl}?variant=${variantId}`
          : productUrl;

        let item = `    <item>
      <g:id>${escapeXml(uniqueId)}</g:id>
      <g:title>${escapeXml(seoTitle || variantTitle)}</g:title>
      <g:description>${escapeXml(seoDescription || description)}</g:description>
      <g:link>${escapeXml(variantUrl)}</g:link>
      <g:canonical_link>${escapeXml(productUrl)}</g:canonical_link>
      <g:image_link>${escapeXml(variantImage)}</g:image_link>
${additionalImages.map((img: string) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>${isAvailable ? 'in_stock' : 'out_of_stock'}</g:availability>
${hasSale ? `      <g:price>${compareAtPrice} ${currency}</g:price>\n      <g:sale_price>${price} ${currency}</g:sale_price>` : `      <g:price>${price} ${currency}</g:price>`}
      <g:brand>${escapeXml(p.vendor || 'Crazy Gels')}</g:brand>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(p.productType || 'Beauty')}</g:product_type>
${color ? `      <g:color>${escapeXml(color)}</g:color>\n` : ''}${size ? `      <g:size>${escapeXml(size)}</g:size>\n` : ''}${material ? `      <g:material>${escapeXml(material)}</g:material>\n` : ''}${style ? `      <g:pattern>${escapeXml(style)}</g:pattern>\n` : ''}      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
${p.tags && Array.isArray(p.tags) && p.tags.length > 0 ? `      <g:custom_label_0>${escapeXml(p.tags[0] || '')}</g:custom_label_0>\n` : ''}${p.productType ? `      <g:custom_label_1>${escapeXml(p.productType)}</g:custom_label_1>\n` : ''}${hasSale ? `      <g:custom_label_2>Sale</g:custom_label_2>\n` : ''}
${variants.length > 1 ? `      <g:item_group_id>${escapeXml(itemGroupId)}</g:item_group_id>\n` : ''}      <g:identifier_exists>false</g:identifier_exists>
      <g:shipping>
        <g:country>DE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>AT</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>NL</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>BE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>IT</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>ES</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>PT</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>GR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>FI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>IE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>LU</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>SK</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>SI</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>EE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>LV</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>LT</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>MT</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>CY</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>GB</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>CH</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>SE</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>DK</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>PL</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>CZ</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>HU</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>RO</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>BG</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>HR</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>CA</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>AU</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
      <g:shipping>
        <g:country>NO</g:country>
        <g:service>Standard</g:service>
        <g:price>0.00 EUR</g:price>
      </g:shipping>
    </item>`;

        items.push(item);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Feed stats: ${totalProducts} products from Shopify, ${items.length} items in feed (${totalVariants} variants). Skipped: ${skippedNoHandle} no handle, ${skippedNoImage} no image, ${skippedNoPrice} no price. Generated: ${new Date().toISOString()} -->
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Crazy Gels - Product Feed</title>
    <link>${BASE_URL}</link>
    <description>Premium semi-cured gel nail wraps, skincare and beauty products from Crazy Gels</description>
${items.join('\n')}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Cache for 1 hour at CDN, revalidate in background. Feed serves
        // live Shopify prices -- shorter cache = faster price updates.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    console.error('Merchant feed error:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed', details: String(error) },
      { status: 500 },
    );
  }
}
