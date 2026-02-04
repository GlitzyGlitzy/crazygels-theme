import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCollections, getAllCollectionProducts, getProducts, isShopifyConfigured } from '@/lib/shopify';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { CheckCircle, XCircle, AlertCircle, Package, FolderOpen, ArrowLeft, RefreshCw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shopify Validation | Crazy Gels Admin',
  description: 'Validate Shopify integration and product data',
  robots: 'noindex, nofollow',
};

export const dynamic = 'force-dynamic';

interface CollectionStats {
  handle: string;
  title: string;
  productCount: number;
}

async function ValidationContent() {
  const stats = {
    configured: isShopifyConfigured,
    totalCollections: 0,
    totalProducts: 0,
    uniqueProducts: new Set<string>(),
    collections: [] as CollectionStats[],
    errors: [] as string[],
  };

  if (!isShopifyConfigured) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800 mb-2">Shopify Not Configured</h3>
            <p className="text-red-700 text-sm mb-4">
              Please add the following environment variables to connect your Shopify store:
            </p>
            <div className="bg-red-100 rounded-lg p-4 font-mono text-sm">
              <p className="text-red-800">SHOPIFY_STORE_DOMAIN=your-store.myshopify.com</p>
              <p className="text-red-800">SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch all collections
  try {
    console.log('[v0] Validation Page: Fetching collections...');
    const collections = await getCollections();
    stats.totalCollections = collections.length;

    // Fetch products for each collection
    for (const collection of collections) {
      try {
        const products = await getAllCollectionProducts(collection.handle);
        stats.collections.push({
          handle: collection.handle,
          title: collection.title,
          productCount: products.length,
        });
        stats.totalProducts += products.length;
        
        // Track unique products
        products.forEach(p => stats.uniqueProducts.add(p.handle));
        
        console.log(`[v0] Validation Page: "${collection.title}" has ${products.length} products`);
      } catch (error: any) {
        stats.errors.push(`Failed to fetch products for "${collection.handle}": ${error.message}`);
      }
    }
  } catch (error: any) {
    stats.errors.push(`Failed to fetch collections: ${error.message}`);
  }

  const uniqueProductCount = stats.uniqueProducts.size;
  const duplicateCount = stats.totalProducts - uniqueProductCount;

  return (
    <div className="space-y-8">
      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-[#2C2C2C]/60 text-sm font-medium">Status</span>
          </div>
          <p className="text-2xl font-semibold text-green-600">Connected</p>
        </div>
        
        <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[#2C2C2C]/60 text-sm font-medium">Collections</span>
          </div>
          <p className="text-2xl font-semibold text-[#2C2C2C]">{stats.totalCollections}</p>
        </div>
        
        <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <span className="text-[#2C2C2C]/60 text-sm font-medium">Unique Products</span>
          </div>
          <p className="text-2xl font-semibold text-[#2C2C2C]">{uniqueProductCount}</p>
        </div>
        
        <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#8B7355]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#8B7355]" />
            </div>
            <span className="text-[#2C2C2C]/60 text-sm font-medium">Total (with duplicates)</span>
          </div>
          <p className="text-2xl font-semibold text-[#2C2C2C]">{stats.totalProducts}</p>
          {duplicateCount > 0 && (
            <p className="text-xs text-[#8B7355] mt-1">
              {duplicateCount} products in multiple collections
            </p>
          )}
        </div>
      </div>

      {/* Errors */}
      {stats.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 mb-2">Errors</h3>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                {stats.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Collections Table */}
      <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D4AF37]/20">
          <h3 className="font-semibold text-[#2C2C2C]">Collections Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#FAF7F2]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider">
                  Handle
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-[#2C2C2C]/60 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4AF37]/10">
              {stats.collections.map((collection) => (
                <tr key={collection.handle} className="hover:bg-[#FAF7F2]/50">
                  <td className="px-6 py-4 text-sm font-medium text-[#2C2C2C]">
                    {collection.title}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#2C2C2C]/60 font-mono">
                    {collection.handle}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      collection.productCount > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {collection.productCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">
                    <Link
                      href={`/collections/${collection.handle}`}
                      className="text-[#D4AF37] hover:text-[#B8860B] font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#FAF7F2]">
              <tr>
                <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-[#2C2C2C]">
                  Total
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-right text-[#2C2C2C]">
                  {stats.totalProducts}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Console Log Hint */}
      <div className="bg-[#FAF7F2] border border-[#D4AF37]/20 rounded-xl p-6">
        <h3 className="font-semibold text-[#2C2C2C] mb-2">Debug Logs</h3>
        <p className="text-[#2C2C2C]/60 text-sm">
          Check your browser console or server logs for detailed [v0] debug messages showing 
          the complete fetch process for collections and products.
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
            <div className="h-10 w-10 rounded-full bg-[#E8C4C4]/20 animate-pulse mb-3" />
            <div className="h-8 w-20 bg-[#E8C4C4]/20 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-[#E8C4C4]/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ValidationPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <DynamicHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-light tracking-[0.1em] text-[#2C2C2C]">
                SHOPIFY <span className="font-medium text-[#D4AF37]">VALIDATION</span>
              </h1>
              <p className="text-[#2C2C2C]/60 mt-1">
                Verify your Shopify integration and product data
              </p>
            </div>
            <a
              href="/admin/validation"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#B8860B] text-white font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </a>
          </div>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <ValidationContent />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}
