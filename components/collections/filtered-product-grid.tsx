'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import { Product } from '@/lib/shopify/types';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters, extractFilterOptions, filterProducts, type FilterOptions } from './product-filters';
import { SubcategoryNav } from './subcategory-nav';
import { Grid3X3 } from 'lucide-react';
import Link from 'next/link';
import type { Subcategory } from '@/lib/subcategories';

interface SubcategoryEntry {
  subcategory: Subcategory;
  count: number;
}

export function FilteredProductGrid({
  products,
  filterOptions,
  collectionHandle,
  subcategoryCounts,
}: {
  products: Product[];
  filterOptions: FilterOptions;
  collectionHandle: string;
  subcategoryCounts: SubcategoryEntry[];
}) {
  const searchParams = useSearchParams();

  // Read subcategory from URL
  const activeSubcategory = searchParams.get('subcategory') || '';

  // Read filters from URL
  const activeTypes = searchParams.get('type')?.split(',').filter(Boolean) || [];
  const activePrice = searchParams.get('price')?.split(',').filter(Boolean) || [];
  const activeColors = searchParams.get('color')?.split(',').filter(Boolean) || [];
  const setsOnly = searchParams.get('sets') === 'true';

  const hasActiveFilters = activeTypes.length > 0 || activePrice.length > 0 || activeColors.length > 0 || setsOnly;

  // Apply subcategory filter first, then additional filters
  const filteredProducts = useMemo(() => {
    let result = products;

    // Subcategory filter
    if (activeSubcategory) {
      const matchingSc = subcategoryCounts.find((sc) => sc.subcategory.slug === activeSubcategory);
      if (matchingSc) {
        result = result.filter((p) => {
          const text = `${p.title} ${p.description} ${p.tags?.join(' ') || ''} ${p.productType || ''}`.toLowerCase();
          return matchingSc.subcategory.keywords.some((kw) => text.includes(kw.toLowerCase()));
        });
      }
    }

    // Additional filters
    if (hasActiveFilters) {
      result = filterProducts(result, {
        types: activeTypes.length > 0 ? activeTypes : undefined,
        priceLabels: activePrice.length > 0 ? activePrice : undefined,
        colors: activeColors.length > 0 ? activeColors : undefined,
        setsOnly: setsOnly || undefined,
      }) as Product[];
    }

    return result;
  }, [products, activeSubcategory, subcategoryCounts, activeTypes, activePrice, activeColors, setsOnly, hasActiveFilters]);

  const showingFiltered = hasActiveFilters || !!activeSubcategory;

  return (
    <div>
      {/* Subcategory pills */}
      {subcategoryCounts.length > 0 && (
        <SubcategoryNav subcategories={subcategoryCounts} totalCount={products.length} />
      )}

      {/* Additional filters */}
      <div className="mb-6">
        <ProductFilters filterOptions={filterOptions} />
      </div>

      {showingFiltered && (
        <p className="mb-4 text-sm text-[#2C2C2C]/60">
          Showing <span className="font-semibold text-[#2C2C2C]">{filteredProducts.length}</span> of{' '}
          <span className="font-semibold text-[#2C2C2C]">{products.length}</span> products
        </p>
      )}

      {filteredProducts.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-[#B76E79]/20 bg-[#FFFEF9]">
          <div className="mb-4 h-16 w-16 rounded-full bg-[#B76E79]/20 flex items-center justify-center">
            <Grid3X3 className="h-8 w-8 text-[#B76E79]" />
          </div>
          <h3 className="text-lg font-semibold text-[#2C2C2C]">No matching products</h3>
          <p className="mt-2 text-[#2C2C2C]/60 text-center max-w-sm">
            Try adjusting your filters to find what you are looking for
          </p>
        </div>
      ) : (
        <ProductGrid products={filteredProducts} />
      )}
    </div>
  );
}
