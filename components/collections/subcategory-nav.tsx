'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import type { Subcategory } from '@/lib/subcategories';

interface SubcategoryNavProps {
  subcategories: { subcategory: Subcategory; count: number }[];
  totalCount: number;
}

export function SubcategoryNav({ subcategories, totalCount }: SubcategoryNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSubcategory = searchParams.get('subcategory') || '';

  const setSubcategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set('subcategory', slug);
      } else {
        params.delete('subcategory');
      }
      // Reset page-level filters when changing subcategory
      params.delete('type');
      params.delete('price');
      params.delete('color');
      params.delete('sets');
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  if (subcategories.length === 0) return null;

  return (
    <nav aria-label="Subcategories" className="mb-6">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {/* All button */}
        <button
          onClick={() => setSubcategory('')}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
            !activeSubcategory
              ? 'bg-[#B76E79] text-white shadow-sm'
              : 'bg-[#FFFEF9] text-[#2C2C2C]/70 border border-[#B76E79]/20 hover:border-[#B76E79]/40 hover:text-[#2C2C2C]'
          }`}
        >
          All
          <span className="ml-1.5 text-xs opacity-70">{totalCount}</span>
        </button>

        {subcategories.map(({ subcategory, count }) => (
          <button
            key={subcategory.slug}
            onClick={() => setSubcategory(subcategory.slug)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeSubcategory === subcategory.slug
                ? 'bg-[#B76E79] text-white shadow-sm'
                : 'bg-[#FFFEF9] text-[#2C2C2C]/70 border border-[#B76E79]/20 hover:border-[#B76E79]/40 hover:text-[#2C2C2C]'
            }`}
          >
            {subcategory.label}
            <span className="ml-1.5 text-xs opacity-70">{count}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
