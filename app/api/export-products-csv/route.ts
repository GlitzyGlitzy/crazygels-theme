import { NextResponse } from 'next/server';
import { getAllProducts, getProduct } from '@/lib/shopify';
import { buildSeoTitle, buildSeoDescription } from '@/lib/seo';

/**
 * Shopify Product CSV Export
 * Generates a CSV in Shopify's exact import format with:
 * - Optimized SEO Title & Description
 * - Google Shopping fields (Product Category, Condition, etc.)
 * - All variants with pricing and options
 * - All images with alt text
 * - Proper status and published flags
 *
 * Visit /api/export-products-csv to download.
 */

// Google Product Category mappings for Shopify's Google Shopping fields
const GOOGLE_CATEGORIES: Record<string, string> = {
  'gel nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail wraps': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  nails: 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Artificial Nails & Accessories',
  'nail accessories': 'Health & Beauty > Personal Care > Cosmetics > Nail Care > Manicure & Pedicure Tools',
  'hair care': 'Health & Beauty > Personal Care > Hair Care',
  haircare: 'Health & Beauty > Personal Care > Hair Care',
  'hair extensions': 'Health & Beauty > Personal Care > Hair Care > Hair Extensions',
  skincare: 'Health & Beauty > Personal Care > Skin Care',
  'skin care': 'Health & Beauty > Personal Care > Skin Care',
  treatments: 'Health & Beauty > Personal Care > Skin Care',
  'collagen masks': 'Health & Beauty > Personal Care > Skin Care > Facial Masks',
};

// Shopify Product Type to Google Shopping Custom Labels
const CUSTOM_LABELS: Record<string, string> = {
  nails: 'Bestseller',
  'gel nail wraps': 'Bestseller',
  'nail wraps': 'Bestseller',
  skincare: 'Premium',
  'skin care': 'Premium',
  'hair care': 'Premium',
  haircare: 'Premium',
};

// Escape CSV value -- wrap in quotes if it contains commas, quotes, or newlines
function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Clean HTML from descriptions
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function GET() {
  try {
    // Shopify CSV column headers -- exact format Shopify expects
    const headers = [
      'Handle',
      'Title',
      'Body (HTML)',
      'Vendor',
      'Product Category',
      'Type',
      'Tags',
      'Published',
      'Option1 Name',
      'Option1 Value',
      'Option2 Name',
      'Option2 Value',
      'Option3 Name',
      'Option3 Value',
      'Variant SKU',
      'Variant Grams',
      'Variant Inventory Tracker',
      'Variant Inventory Policy',
      'Variant Fulfillment Service',
      'Variant Price',
      'Variant Compare At Price',
      'Variant Requires Shipping',
      'Variant Taxable',
      'Variant Barcode',
      'Image Src',
      'Image Position',
      'Image Alt Text',
      'Gift Card',
      'SEO Title',
      'SEO Description',
      'Google Shopping / Google Product Category',
      'Google Shopping / Gender',
      'Google Shopping / Age Group',
      'Google Shopping / MPN',
      'Google Shopping / Condition',
      'Google Shopping / Custom Product',
      'Google Shopping / Custom Label 0',
      'Google Shopping / Custom Label 1',
      'Variant Image',
      'Variant Weight Unit',
      'Variant Tax Code',
      'Cost per item',
      'Included / International',
      'Included / United States',
      'Price / International',
      'Price / United States',
      'Compare At Price / International',
      'Compare At Price / United States',
      'Status',
    ];

    // Fetch all products via Storefront API
    const products = await getAllProducts({});
    
    // Now fetch full details for each product (with descriptionHtml and full variant/image data)
    const rows: string[][] = [];

    for (const product of products) {
      // Fetch full product data including descriptionHtml
      let fullProduct;
      try {
        fullProduct = await getProduct(product.handle);
      } catch {
        fullProduct = product;
      }
      const p = fullProduct || product;

      const typeKey = (p.productType || '').toLowerCase().trim();
      const googleCategory = GOOGLE_CATEGORIES[typeKey] || 'Health & Beauty > Personal Care > Cosmetics';
      const customLabel = CUSTOM_LABELS[typeKey] || '';

      // Build optimized SEO fields
      const priceStr = p.priceRange?.minVariantPrice
        ? `$${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}`
        : '';
      const seoTitle = buildSeoTitle(p.title, p.productType);
      const seoDescription = buildSeoDescription(p.title, p.description || '', p.productType, priceStr);

      // Clean body HTML -- keep the HTML for Shopify but ensure it's well-formed
      const bodyHtml = (p as Record<string, unknown>).descriptionHtml as string || p.description || '';

      // Build tags array
      const tags = (p.tags || []).join(', ');

      // Extract options (up to 3)
      const options = p.options || [];
      const opt1Name = options[0]?.name || '';
      const opt2Name = options[1]?.name || '';
      const opt3Name = options[2]?.name || '';

      // Extract variant data
      const variants = p.variants?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];
      // Extract image data
      const images = p.images?.edges?.map((e: { node: Record<string, unknown> }) => e.node) || [];

      // MPN = Shopify product ID number
      const mpn = p.id?.split('/').pop() || p.handle;

      // Calculate how many rows this product needs (max of variants and images)
      const maxRows = Math.max(variants.length || 1, images.length || 1);

      for (let i = 0; i < maxRows; i++) {
        const variant = variants[i];
        const image = images[i];
        const isFirstRow = i === 0;

        // Variant option values
        const selectedOptions = variant?.selectedOptions || [];
        const opt1Val = selectedOptions[0]?.value || '';
        const opt2Val = selectedOptions[1]?.value || '';
        const opt3Val = selectedOptions[2]?.value || '';

        // Variant pricing
        const variantPrice = variant ? parseFloat(variant.price?.amount || '0').toFixed(2) : '';
        const compareAtPrice = variant?.compareAtPrice
          ? parseFloat(variant.compareAtPrice.amount).toFixed(2)
          : '';
        
        // Variant SKU -- use variant ID if no SKU
        const variantSku = variant ? (variant.sku || variant.id?.split('/').pop() || '') : '';

        // Variant image URL
        const variantImage = variant?.image?.url || '';

        const row = [
          // Handle -- always present
          p.handle,
          // Title -- only on first row
          isFirstRow ? p.title : '',
          // Body (HTML) -- only on first row
          isFirstRow ? bodyHtml : '',
          // Vendor -- only on first row
          isFirstRow ? (p.vendor || 'Crazy Gels') : '',
          // Product Category -- only on first row
          isFirstRow ? googleCategory : '',
          // Type -- only on first row
          isFirstRow ? (p.productType || '') : '',
          // Tags -- only on first row
          isFirstRow ? tags : '',
          // Published
          isFirstRow ? 'TRUE' : '',
          // Option1 Name/Value
          isFirstRow ? opt1Name : '',
          opt1Val,
          // Option2 Name/Value
          isFirstRow ? opt2Name : '',
          opt2Val,
          // Option3 Name/Value
          isFirstRow ? opt3Name : '',
          opt3Val,
          // Variant SKU
          variantSku,
          // Variant Grams
          variant ? '0' : '',
          // Variant Inventory Tracker
          variant ? 'shopify' : '',
          // Variant Inventory Policy
          variant ? 'deny' : '',
          // Variant Fulfillment Service
          variant ? 'manual' : '',
          // Variant Price
          variantPrice,
          // Variant Compare At Price
          compareAtPrice,
          // Variant Requires Shipping
          variant ? 'TRUE' : '',
          // Variant Taxable
          variant ? 'TRUE' : '',
          // Variant Barcode
          '',
          // Image Src
          image?.url || '',
          // Image Position
          image ? String(i + 1) : '',
          // Image Alt Text
          image?.altText || (isFirstRow && image ? stripHtml(p.title) : ''),
          // Gift Card
          isFirstRow ? 'FALSE' : '',
          // SEO Title -- only on first row
          isFirstRow ? seoTitle : '',
          // SEO Description -- only on first row
          isFirstRow ? seoDescription : '',
          // Google Shopping / Google Product Category
          isFirstRow ? googleCategory : '',
          // Google Shopping / Gender
          isFirstRow ? 'Unisex' : '',
          // Google Shopping / Age Group
          isFirstRow ? 'Adult' : '',
          // Google Shopping / MPN
          isFirstRow ? mpn : '',
          // Google Shopping / Condition
          isFirstRow ? 'New' : '',
          // Google Shopping / Custom Product
          '',
          // Google Shopping / Custom Label 0
          isFirstRow ? customLabel : '',
          // Google Shopping / Custom Label 1
          isFirstRow ? (p.productType || '') : '',
          // Variant Image
          variantImage,
          // Variant Weight Unit
          variant ? 'g' : '',
          // Variant Tax Code
          '',
          // Cost per item
          '',
          // Included / International
          isFirstRow ? 'TRUE' : '',
          // Included / United States
          isFirstRow ? 'TRUE' : '',
          // Price / International
          variantPrice,
          // Price / United States
          variantPrice,
          // Compare At Price / International
          compareAtPrice,
          // Compare At Price / United States
          compareAtPrice,
          // Status
          isFirstRow ? 'active' : '',
        ];

        rows.push(row);
      }
    }

    // Build CSV string
    const csvLines = [
      headers.map(csvEscape).join(','),
      ...rows.map((row) => row.map(csvEscape).join(',')),
    ];
    const csvContent = csvLines.join('\n');

    // Return as downloadable CSV
    const now = new Date().toISOString().split('T')[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crazygels-products-${now}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export products', details: String(error) },
      { status: 500 }
    );
  }
}
