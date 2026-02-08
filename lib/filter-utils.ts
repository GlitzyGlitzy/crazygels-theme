// Server-safe filter utility functions (no 'use client' directive)
// These can be imported by both server and client components.

export type FilterOptions = {
  productTypes: string[];
  priceRanges: { label: string; min: number; max: number }[];
  colors: string[];
  hasSets: boolean;
};

export const PRICE_RANGES = [
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
    if (product.productType) {
      productTypes.add(product.productType);
    }

    const colorOption = product.options?.find(
      (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
    );
    if (colorOption) {
      for (const value of colorOption.values) {
        colors.add(value);
      }
    }

    const text = `${product.title} ${product.tags?.join(' ') || ''}`.toLowerCase();
    if (text.includes('set') || text.includes('bundle') || text.includes('kit') || text.includes('pack')) {
      hasSets = true;
    }
  }

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
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(product.productType)) return false;
    }

    if (filters.priceLabels && filters.priceLabels.length > 0) {
      const price = parseFloat(product.priceRange.minVariantPrice.amount);
      const matchesAnyRange = filters.priceLabels.some((label) => {
        const range = PRICE_RANGES.find((r) => r.label === label);
        return range && price >= range.min && price < range.max;
      });
      if (!matchesAnyRange) return false;
    }

    if (filters.colors && filters.colors.length > 0) {
      const colorOption = product.options?.find(
        (opt) => opt.name.toLowerCase() === 'color' || opt.name.toLowerCase() === 'colour'
      );
      if (!colorOption) return false;
      const productColors = colorOption.values.map((v) => v);
      if (!filters.colors.some((c) => productColors.includes(c))) return false;
    }

    if (filters.setsOnly) {
      const text = `${product.title} ${product.tags?.join(' ') || ''}`.toLowerCase();
      if (!text.includes('set') && !text.includes('bundle') && !text.includes('kit') && !text.includes('pack')) {
        return false;
      }
    }

    return true;
  });
}
