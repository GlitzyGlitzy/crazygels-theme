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
const GOOGLE_CATEGORIES: Record<string, string> = {
  'gel nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  nails: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail accessories': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Manicure & Pedicure Tools',
  'uv lamp': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  'uv light': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  'nail lamp': 'Health & Beauty > Personal Care > Cosmetics > Cosmetic Tools > Nail Tools',
  'hair care': 'Health & Beauty > Personal Care > Hair Care',
  haircare: 'Health & Beauty > Personal Care > Hair Care',
  'hair extensions': 'Health & Beauty > Personal Care > Hair Care > Hair Extensions',
  skincare: 'Health & Beauty > Personal Care > Skin Care',
  'skin care': 'Health & Beauty > Personal Care > Skin Care',
  treatments: 'Health & Beauty > Personal Care > Skin Care',
  'collagen masks': 'Health & Beauty > Personal Care > Skin Care > Facial Masks',
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

    for (const product of products) {
      const p = product;

      // Skip products without a valid handle or title (causes "Product page unavailable")
      if (!p.handle || !p.title) continue;

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

      // Get all images
      const imageUrls = p.images?.edges?.map((e: { node: { url: string } }) => e.node.url) || [];
      const mainImage = imageUrls[0] || p.featuredImage?.url || '';
      const additionalImages = imageUrls.slice(1, 10); // Google allows up to 10 additional images

      // MPN -- Shopify product ID
      const mpn = p.id?.split('/').pop() || p.handle;

      // Process each variant as a separate item (Google recommends this for variants)
      const variants = p.variants?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];

      for (const variant of variants) {
        const variantId = variant.id?.split('/').pop() || '';
        const price = parseFloat(variant.price?.amount || '0').toFixed(2);
        const currency = variant.price?.currencyCode || 'EUR';
        const compareAtPrice = variant.compareAtPrice
          ? parseFloat(variant.compareAtPrice.amount).toFixed(2)
          : '';
        const isAvailable = variant.availableForSale !== false;
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

        // Skip products with no price (causes "Missing product price" error)
        if (!price || price === '0.00') continue;

        // Unique ID per variant
        const uniqueId =
          variants.length > 1 ? `shopify_${mpn}_${variantId}` : `shopify_${mpn}`;

        // For sale_price: only include if compareAtPrice is HIGHER than the current price
        const hasSale = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);

        let item = `    <item>
      <g:id>${escapeXml(uniqueId)}</g:id>
      <g:title>${escapeXml(seoTitle || variantTitle)}</g:title>
      <g:description>${escapeXml(seoDescription || description)}</g:description>
      <g:link>${escapeXml(`${BASE_URL}/products/${p.handle}`)}</g:link>
      <g:image_link>${escapeXml(variantImage)}</g:image_link>
${additionalImages.map((img: string) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`).join('\n')}
      <g:availability>${isAvailable ? 'in_stock' : 'out_of_stock'}</g:availability>
${hasSale ? `      <g:price>${compareAtPrice} EUR</g:price>\n      <g:sale_price>${price} EUR</g:sale_price>` : `      <g:price>${price} EUR</g:price>`}
      <g:brand>${escapeXml(p.vendor || 'Crazy Gels')}</g:brand>
      <g:mpn>${escapeXml(mpn)}</g:mpn>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
      <g:product_type>${escapeXml(p.productType || 'Beauty')}</g:product_type>
${color ? `      <g:color>${escapeXml(color)}</g:color>\n` : ''}${size ? `      <g:size>${escapeXml(size)}</g:size>\n` : ''}${material ? `      <g:material>${escapeXml(material)}</g:material>\n` : ''}${style ? `      <g:pattern>${escapeXml(style)}</g:pattern>\n` : ''}      <g:gender>unisex</g:gender>
      <g:age_group>adult</g:age_group>
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
      <g:tax>
        <g:country>DE</g:country>
        <g:tax_ship>yes</g:tax_ship>
        <g:rate>19</g:rate>
      </g:tax>
    </item>`;

        items.push(item);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
        'Cache-Control': 'public, max-age=21600, s-maxage=21600', // 6 hours
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
