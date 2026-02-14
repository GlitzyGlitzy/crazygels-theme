import { NextResponse } from 'next/server';
import { getProduct, getAllProducts } from '@/lib/shopify';
import { buildSeoTitle, buildSeoDescription } from '@/lib/seo';
import type { Product, Image as ShopifyImage, ProductVariant } from '@/lib/shopify/types';

/**
 * Shopify Product CSV Export
 * Generates a CSV that exactly matches Shopify's product import format.
 *
 * Key Shopify CSV rules:
 * 1. First row for a product has ALL fields (title, body, vendor, tags, etc.)
 * 2. Subsequent rows for the SAME handle carry only:
 *    - Handle (always required)
 *    - Variant columns (if adding more variants)
 *    - Image columns (if adding more images)
 * 3. Variant rows and image rows are separate -- a row is either a variant row
 *    or an image-only row, never both (unless it's the first row).
 * 4. Column names must match Shopify's exact expected headers.
 */

// ── Google Product Category mappings ──
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
  fragrance: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
  fragrances: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
  perfume: 'Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne',
};

const CUSTOM_LABELS: Record<string, string> = {
  nails: 'Bestseller',
  'gel nail wraps': 'Bestseller',
  'nail wraps': 'Bestseller',
  skincare: 'Premium',
  'skin care': 'Premium',
  'hair care': 'Premium',
  haircare: 'Premium',
};

// ── CSV helpers ──

function csvEscape(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ── Shopify CSV column headers (exact names Shopify expects) ──
const SHOPIFY_CSV_HEADERS = [
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
  'Variant Inventory Qty',
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

// Build an empty row (all blank columns) keyed to SHOPIFY_CSV_HEADERS length
function emptyRow(): string[] {
  return new Array(SHOPIFY_CSV_HEADERS.length).fill('');
}

// Column index lookup for cleaner code
const COL: Record<string, number> = {};
SHOPIFY_CSV_HEADERS.forEach((h, i) => {
  COL[h] = i;
});

/**
 * Build all CSV rows for a single product.
 *
 * Shopify structure:
 *  Row 1: product details + first variant + first image
 *  Row 2..N: additional variant rows (handle + variant fields + optionally an image)
 *  Row N+1..M: image-only rows (handle + image fields only)
 */
function buildProductRows(p: Product): string[][] {
  const rows: string[][] = [];

  const typeKey = (p.productType || '').toLowerCase().trim();
  const googleCategory = GOOGLE_CATEGORIES[typeKey] || 'Health & Beauty > Personal Care > Cosmetics';
  const customLabel = CUSTOM_LABELS[typeKey] || '';

  // SEO
  const priceStr = p.priceRange?.minVariantPrice
    ? `$${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}`
    : '';
  const seoTitle = buildSeoTitle(p.title, p.productType);
  const seoDescription = buildSeoDescription(p.title, p.description || '', p.productType, priceStr);

  // Body HTML -- getProduct returns descriptionHtml on the product
  const bodyHtml = p.descriptionHtml || p.description || '';

  // Tags as comma-separated string
  const tags = (p.tags || []).join(', ');

  // Options (up to 3)
  const options = p.options || [];
  const opt1Name = options[0]?.name || 'Title';
  const opt2Name = options[1]?.name || '';
  const opt3Name = options[2]?.name || '';

  // Variants -- getProduct reshapes but keeps edges format for variants
  const variants: ProductVariant[] = p.variants?.edges?.map((e) => e.node) || [];

  // Images -- getProduct reshapes images into a flat Image[] array
  const images: ShopifyImage[] = Array.isArray(p.images)
    ? (p.images as ShopifyImage[])
    : (p.images as unknown as { edges: { node: ShopifyImage }[] })?.edges?.map((e) => e.node) || [];

  // MPN = Shopify product numeric ID
  const mpn = p.id?.split('/').pop() || p.handle;

  // ── Row 1: Full product + first variant + first image ──
  const firstVariant = variants[0];
  const firstImage = images[0];

  const row1 = emptyRow();
  // Product fields
  row1[COL['Handle']] = p.handle;
  row1[COL['Title']] = p.title;
  row1[COL['Body (HTML)']] = bodyHtml;
  row1[COL['Vendor']] = p.vendor || 'Crazy Gels';
  row1[COL['Product Category']] = googleCategory;
  row1[COL['Type']] = p.productType || '';
  row1[COL['Tags']] = tags;
  row1[COL['Published']] = 'true';
  row1[COL['Option1 Name']] = opt1Name;
  row1[COL['Option2 Name']] = opt2Name;
  row1[COL['Option3 Name']] = opt3Name;
  row1[COL['Gift Card']] = 'FALSE';
  row1[COL['SEO Title']] = seoTitle;
  row1[COL['SEO Description']] = seoDescription;
  row1[COL['Google Shopping / Google Product Category']] = googleCategory;
  row1[COL['Google Shopping / Gender']] = 'Unisex';
  row1[COL['Google Shopping / Age Group']] = 'Adult';
  row1[COL['Google Shopping / MPN']] = mpn;
  row1[COL['Google Shopping / Condition']] = 'New';
  row1[COL['Google Shopping / Custom Label 0']] = customLabel;
  row1[COL['Google Shopping / Custom Label 1']] = p.productType || '';
  row1[COL['Included / International']] = 'TRUE';
  row1[COL['Included / United States']] = 'TRUE';
  row1[COL['Status']] = 'active';

  // First variant fields
  if (firstVariant) {
    fillVariantColumns(row1, firstVariant, opt1Name);
  } else {
    // Product with no variants -- set default
    row1[COL['Option1 Value']] = 'Default Title';
    row1[COL['Variant Price']] = parseFloat(p.priceRange?.minVariantPrice?.amount || '0').toFixed(2);
    row1[COL['Variant Requires Shipping']] = 'true';
    row1[COL['Variant Taxable']] = 'true';
    row1[COL['Variant Inventory Policy']] = 'deny';
    row1[COL['Variant Fulfillment Service']] = 'manual';
    row1[COL['Variant Grams']] = '0';
    row1[COL['Variant Weight Unit']] = 'g';
  }

  // First image
  if (firstImage) {
    row1[COL['Image Src']] = firstImage.url || '';
    row1[COL['Image Position']] = '1';
    row1[COL['Image Alt Text']] = firstImage.altText || p.title;
  }

  rows.push(row1);

  // ── Rows 2..N: Additional variants ──
  for (let i = 1; i < variants.length; i++) {
    const variant = variants[i];
    const row = emptyRow();
    row[COL['Handle']] = p.handle;

    fillVariantColumns(row, variant, opt1Name);

    // If there's a matching image at the same index, attach it
    if (images[i]) {
      row[COL['Image Src']] = images[i].url || '';
      row[COL['Image Position']] = String(i + 1);
      row[COL['Image Alt Text']] = images[i].altText || p.title;
    }

    rows.push(row);
  }

  // ── Remaining image-only rows (images beyond the number of variants) ──
  for (let i = Math.max(variants.length, 1); i < images.length; i++) {
    const row = emptyRow();
    row[COL['Handle']] = p.handle;
    row[COL['Image Src']] = images[i].url || '';
    row[COL['Image Position']] = String(i + 1);
    row[COL['Image Alt Text']] = images[i].altText || p.title;
    rows.push(row);
  }

  return rows;
}

function fillVariantColumns(row: string[], variant: ProductVariant, _opt1Name: string): void {
  const selectedOptions = variant.selectedOptions || [];
  row[COL['Option1 Value']] = selectedOptions[0]?.value || '';
  row[COL['Option2 Value']] = selectedOptions[1]?.value || '';
  row[COL['Option3 Value']] = selectedOptions[2]?.value || '';
  row[COL['Variant SKU']] = variant.id?.split('/').pop() || '';
  row[COL['Variant Grams']] = '0';
  row[COL['Variant Inventory Tracker']] = 'shopify';
  row[COL['Variant Inventory Qty']] = '';
  row[COL['Variant Inventory Policy']] = 'deny';
  row[COL['Variant Fulfillment Service']] = 'manual';
  row[COL['Variant Price']] = parseFloat(variant.price?.amount || '0').toFixed(2);
  row[COL['Variant Compare At Price']] = variant.compareAtPrice
    ? parseFloat(variant.compareAtPrice.amount).toFixed(2)
    : '';
  row[COL['Variant Requires Shipping']] = 'true';
  row[COL['Variant Taxable']] = 'true';
  row[COL['Variant Barcode']] = '';
  row[COL['Variant Image']] = variant.image?.url || '';
  row[COL['Variant Weight Unit']] = 'g';
  row[COL['Variant Tax Code']] = '';
  row[COL['Cost per item']] = '';

  // Market pricing -- repeat variant price for each market
  const price = parseFloat(variant.price?.amount || '0').toFixed(2);
  const compareAt = variant.compareAtPrice
    ? parseFloat(variant.compareAtPrice.amount).toFixed(2)
    : '';
  row[COL['Price / International']] = price;
  row[COL['Price / United States']] = price;
  row[COL['Compare At Price / International']] = compareAt;
  row[COL['Compare At Price / United States']] = compareAt;
}

export async function GET() {
  try {
    // Step 1: Fetch lightweight product list (handles)
    const productList = await getAllProducts({});

    // Step 2: Fetch full product data for each product (with descriptionHtml, all variants, all images)
    // Process in batches to avoid overwhelming Shopify rate limits
    const BATCH_SIZE = 5;
    const allRows: string[][] = [];

    for (let batchStart = 0; batchStart < productList.length; batchStart += BATCH_SIZE) {
      const batch = productList.slice(batchStart, batchStart + BATCH_SIZE);
      const fullProducts = await Promise.all(
        batch.map(async (product) => {
          try {
            const full = await getProduct(product.handle);
            return full || product;
          } catch {
            return product;
          }
        })
      );

      for (const p of fullProducts) {
        const productRows = buildProductRows(p);
        allRows.push(...productRows);
      }
    }

    // Step 3: Build CSV string with BOM for Excel compatibility
    const csvLines = [
      SHOPIFY_CSV_HEADERS.map(csvEscape).join(','),
      ...allRows.map((row) => row.map(csvEscape).join(',')),
    ];
    const BOM = '\uFEFF';
    const csvContent = BOM + csvLines.join('\n');

    const now = new Date().toISOString().split('T')[0];
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="crazygels-shopify-products-${now}.csv"`,
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
