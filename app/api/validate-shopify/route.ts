import { NextResponse } from 'next/server';
import { getCollections, getAllCollectionProducts, getProducts, isShopifyConfigured } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

interface CollectionStats {
  handle: string;
  title: string;
  productCount: number;
  products: { handle: string; title: string }[];
}

interface ValidationResult {
  configured: boolean;
  timestamp: string;
  totalCollections: number;
  totalProducts: number;
  uniqueProducts: number;
  duplicateProducts: number;
  collections: CollectionStats[];
  errors: string[];
}

export async function GET() {
  const result: ValidationResult = {
    configured: isShopifyConfigured,
    timestamp: new Date().toISOString(),
    totalCollections: 0,
    totalProducts: 0,
    uniqueProducts: 0,
    duplicateProducts: 0,
    collections: [],
    errors: [],
  };

  if (!isShopifyConfigured) {
    result.errors.push('Shopify is not configured. Please add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.');
    return NextResponse.json(result, { status: 200 });
  }

  try {
    // Fetch all collections
    console.log('[v0] Validation: Fetching all collections...');
    const collections = await getCollections();
    result.totalCollections = collections.length;
    console.log(`[v0] Validation: Found ${collections.length} collections`);

    // Track all product handles for duplicate detection
    const allProductHandles = new Set<string>();
    const productOccurrences: Record<string, string[]> = {};

    // Fetch products for each collection
    for (const collection of collections) {
      try {
        console.log(`[v0] Validation: Fetching products for collection "${collection.title}" (${collection.handle})...`);
        const products = await getAllCollectionProducts({ handle: collection.handle });
        
        const collectionStats: CollectionStats = {
          handle: collection.handle,
          title: collection.title,
          productCount: products.length,
          products: products.map(p => ({ handle: p.handle, title: p.title })),
        };

        result.collections.push(collectionStats);
        result.totalProducts += products.length;

        // Track product occurrences for duplicate detection
        for (const product of products) {
          allProductHandles.add(product.handle);
          if (!productOccurrences[product.handle]) {
            productOccurrences[product.handle] = [];
          }
          productOccurrences[product.handle].push(collection.handle);
        }

        console.log(`[v0] Validation: Collection "${collection.title}" has ${products.length} products`);
      } catch (error: any) {
        const errorMsg = `Failed to fetch products for collection "${collection.handle}": ${error.message}`;
        result.errors.push(errorMsg);
        console.error(`[v0] Validation: ${errorMsg}`);
      }
    }

    // Calculate unique products and duplicates
    result.uniqueProducts = allProductHandles.size;
    result.duplicateProducts = result.totalProducts - result.uniqueProducts;

    // Log summary
    console.log('[v0] Validation Summary:');
    console.log(`[v0]   - Total Collections: ${result.totalCollections}`);
    console.log(`[v0]   - Total Products (including duplicates): ${result.totalProducts}`);
    console.log(`[v0]   - Unique Products: ${result.uniqueProducts}`);
    console.log(`[v0]   - Products in multiple collections: ${result.duplicateProducts}`);

    // Log products that appear in multiple collections
    const multiCollectionProducts = Object.entries(productOccurrences)
      .filter(([_, collections]) => collections.length > 1);
    
    if (multiCollectionProducts.length > 0) {
      console.log('[v0] Products appearing in multiple collections:');
      multiCollectionProducts.forEach(([handle, collections]) => {
        console.log(`[v0]   - ${handle}: ${collections.join(', ')}`);
      });
    }

  } catch (error: any) {
    result.errors.push(`Failed to fetch collections: ${error.message}`);
    console.error('[v0] Validation: Failed to fetch collections:', error);
  }

  return NextResponse.json(result, { status: 200 });
}
