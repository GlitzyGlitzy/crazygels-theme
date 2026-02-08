'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, SlidersHorizontal } from 'lucide-react';

export type FilterOptions = {
  productTypes: string[];
  priceRanges: { label: string; min: number; max: number }[];
  colors: string[];
  hasSets: boolean;
};

const PRICE_RANGES = [
  { label: 'Under $10', min: 0, max: 10 },
  { label: '$10 - $25', min: 10, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: 'Over $100', min: 100, max: Infinity },
];

// Extract available filter options from a set of products
export function extractFilterOptions(products: {
  productType: string;
  options: { name: string; values: string[] }[];
  priceRange: { minVariantPrice: { amount: string } };
  tags: string[];
  title: string;
}[]): FilterOptions {
  const productTypes = new Set<string>();
  const colors = new Set<string>();
  let hasSets = false;

  for (const product of products) {
    // Product types
    if (product.productType) {
      productTypes.add(product.productType);
    }

    // Colors from variant options
    const colorOption = product.options?.find(
      (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
    );
    if (colorOption) {
      for (const value of colorOption.values) {
        colors.add(value);
      }
    }

    // Check for sets
    const text = `${product.title} ${product.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('set') || text.includes('bundle') || text.includes('kit') || text.includes('pack')) {
      hasSets = true;
    }
  }

  // Determine which price ranges actually have products
  const activePriceRanges = PRICE_RANGES.filter((range) =>
    products.some((p) => {
      const price = parseFloat(p.priceRange.minVariantPrice.amount);
      return price >= range.min && price < range.max;
    })
  );

  return {
    productTypes: Array.from(productTypes).sort(),
    priceRanges: activePriceRanges,
    colors: Array.from(colors).sort(),
    hasSets,
  };
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (options.length === 0) return null;

  const activeCount = selected.length;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
          activeCount > 0
            ? 'border-[#B76E79] bg-[#B76E79]/10 text-[#A15D67]'
            : 'border-[#B76E79]/20 bg-[#FFFEF9] text-[#2C2C2C] hover:border-[#B76E79]/40'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{label}</span>
        {activeCount > 0 && (
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B76E79] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 w-56 origin-top-left rounded-xl border border-[#B76E79]/20 bg-[#FFFEF9] p-1 shadow-xl max-h-64 overflow-y-auto"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => onToggle(option)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#B76E79]/10 text-[#A15D67]'
                    : 'text-[#2C2C2C] hover:bg-[#B76E79]/5'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span className="truncate">{option}</span>
                {isSelected && <Check className="h-4 w-4 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProductFilters({ filterOptions }: { filterOptions: FilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Read current filters from URL
  const activeTypes = searchParams.get('type')?.split(',').filter(Boolean) || [];
  const activePrice = searchParams.get('price')?.split(',').filter(Boolean) || [];
  const activeColors = searchParams.get('color')?.split(',').filter(Boolean) || [];
  const setsOnly = searchParams.get('sets') === 'true';

  const totalActiveFilters = activeTypes.length + activePrice.length + activeColors.length + (setsOnly ? 1 : 0);

  const updateFilters = useCallback(
    (key: string, values: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (values.length > 0) {
        params.set(key, values.join(','));
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const toggleFilter = useCallback(
    (key: string, value: string, currentValues: string[]) => {
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];
      updateFilters(key, newValues);
    },
    [updateFilters]
  );

  const toggleSets = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (setsOnly) {
      params.delete('sets');
    } else {
      params.set('sets', 'true');
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams, setsOnly]);

  const clearAllFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('type');
    params.delete('price');
    params.delete('color');
    params.delete('sets');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router, searchParams]);

  const hasAnyFilters = filterOptions.productTypes.length > 0 || filterOptions.colors.length > 0 || filterOptions.hasSets;

  if (!hasAnyFilters) return null;

  const filterContent = (
    <>
      {/* Product Type */}
      <FilterDropdown
        label="Type"
        options={filterOptions.productTypes}
        selected={activeTypes}
        onToggle={(v) => toggleFilter('type', v, activeTypes)}
      />

      {/* Price Range */}
      {filterOptions.priceRanges.length > 0 && (
        <FilterDropdown
          label="Price"
          options={filterOptions.priceRanges.map((r) => r.label)}
          selected={activePrice}
          onToggle={(v) => toggleFilter('price', v, activePrice)}
        />
      )}

      {/* Color */}
      {filterOptions.colors.length > 0 && (
        <FilterDropdown
          label="Color"
          options={filterOptions.colors}
          selected={activeColors}
          onToggle={(v) => toggleFilter('color', v, activeColors)}
        />
      )}

      {/* Sets toggle */}
      {filterOptions.hasSets && (
        <button
          onClick={toggleSets}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
            setsOnly
              ? 'border-[#B76E79] bg-[#B76E79]/10 text-[#A15D67]'
              : 'border-[#B76E79]/20 bg-[#FFFEF9] text-[#2C2C2C] hover:border-[#B76E79]/40'
          }`}
        >
          <span>Sets Only</span>
          {setsOnly && <Check className="h-3.5 w-3.5" />}
        </button>
      )}

      {/* Clear all */}
      {totalActiveFilters > 0 && (
        <button
          onClick={clearAllFilters}
          className="flex items-center gap-1 rounded-full border border-[#2C2C2C]/20 px-3 py-1.5 text-sm text-[#2C2C2C]/60 transition-colors hover:border-[#2C2C2C]/40 hover:text-[#2C2C2C]"
        >
          <X className="h-3.5 w-3.5" />
          <span>Clear all</span>
        </button>
      )}

      {isPending && (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#B76E79] border-t-transparent" />
      )}
    </>
  );

  return (
    <div>
      {/* Desktop filters */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        {filterContent}
      </div>

      {/* Mobile filter toggle */}
      <div className="sm:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
            totalActiveFilters > 0
              ? 'border-[#B76E79] bg-[#B76E79]/10 text-[#A15D67]'
              : 'border-[#B76E79]/20 bg-[#FFFEF9] text-[#2C2C2C] hover:border-[#B76E79]/40'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {totalActiveFilters > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#B76E79] text-[10px] font-bold text-white">
              {totalActiveFilters}
            </span>
          )}
        </button>

        {mobileOpen && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filterContent}
          </div>
        )}
      </div>
    </div>
  );
}

// Client-side filtering logic applied to already-fetched products
export function filterProducts(
  products: {
    productType: string;
    options: { name: string; values: string[] }[];
    priceRange: { minVariantPrice: { amount: string } };
    tags: string[];
    title: string;
  }[],
  filters: {
    types?: string[];
    priceLabels?: string[];
    colors?: string[];
    setsOnly?: boolean;
  }
) {
  return products.filter((product) => {
    // Filter by product type
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(product.productType)) return false;
    }

    // Filter by price range
    if (filters.priceLabels && filters.priceLabels.length > 0) {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      const matchesAnyRange = filters.priceLabels.some((label) => {
        const range = PRICE_RANGES.find((r) => r.label === label);
        return range && price >= range.min && price < range.max;
      });
      if (!matchesAnyRange) return false;
    }

    // Filter by color
    if (filters.colors && filters.colors.length > 0) {
      const colorOption = product.options?.find(
        (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
      );
      if (!colorOption) return false;
      const productColors = colorOption.values.map((v) => v);
      if (!filters.colors.some((c) => productColors.includes(c))) return false;
    }

    // Filter by sets
    if (filters.setsOnly) {
      const text = `${product.title} ${product.tags?.join(' ') || ''}`.toLowerCase();
      if (!text.includes('set') && !text.includes('bundle') && !text.includes('kit') && !text.includes('pack')) {
        return false;
      }
    }

    return true;
  });
}
