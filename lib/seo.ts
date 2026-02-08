/**
 * SEO optimization layer for Crazy Gels product pages.
 * Transforms raw Shopify product data into Google-optimized
 * titles, descriptions, and structured data -- all at render time.
 * The Shopify data is never modified; only the rendered metadata changes.
 */

// Keyword mappings by product type for SEO-rich titles
const PRODUCT_TYPE_KEYWORDS: Record<string, { suffix: string; category: string; keywords: string[] }> = {
  'gel nail wraps': {
    suffix: 'Semi-Cured Gel Nail Strips',
    category: 'Nails',
    keywords: ['gel nails', 'nail wraps', 'press on nails', 'nail strips', 'DIY nails', 'salon nails at home'],
  },
  'nail wraps': {
    suffix: 'Semi-Cured Gel Nail Wraps',
    category: 'Nails',
    keywords: ['gel nail wraps', 'nail strips', 'press on nails', 'DIY manicure'],
  },
  nails: {
    suffix: 'Semi-Cured Gel Nails',
    category: 'Nails',
    keywords: ['gel nails', 'semi-cured nails', 'nail art', 'press on nails'],
  },
  'nail accessories': {
    suffix: 'Nail Art Accessories',
    category: 'Nails',
    keywords: ['nail tools', 'nail art accessories', 'gel nail kit', 'UV lamp'],
  },
  'hair care': {
    suffix: 'Premium Hair Care',
    category: 'Hair',
    keywords: ['hair care', 'hair treatment', 'healthy hair', 'hair growth'],
  },
  haircare: {
    suffix: 'Premium Hair Care',
    category: 'Hair',
    keywords: ['hair care', 'hair treatment', 'healthy hair', 'hair products'],
  },
  'hair extensions': {
    suffix: 'Natural Hair Extensions',
    category: 'Hair',
    keywords: ['hair extensions', 'clip in extensions', 'real hair extensions'],
  },
  skincare: {
    suffix: 'Luxury Skincare',
    category: 'Skin',
    keywords: ['skincare', 'skin care', 'face care', 'anti-aging', 'moisturizer'],
  },
  'skin care': {
    suffix: 'Luxury Skincare',
    category: 'Skin',
    keywords: ['skincare', 'face treatment', 'skin treatment', 'beauty products'],
  },
  treatments: {
    suffix: 'Beauty Treatment',
    category: 'Treatments',
    keywords: ['beauty treatment', 'spa treatment', 'professional beauty tools'],
  },
  'collagen masks': {
    suffix: 'Collagen Face Mask',
    category: 'Skin',
    keywords: ['collagen mask', 'face mask', 'anti-aging mask', 'hydrating mask'],
  },
};

function getProductTypeInfo(productType: string) {
  const key = productType.toLowerCase().trim();
  return PRODUCT_TYPE_KEYWORDS[key] || null;
}

/**
 * Builds an SEO-optimized page title for a product.
 * Format: "[Product Name] - [Type Suffix] | Crazy Gels"
 * Stays under 60 characters when possible.
 */
export function buildSeoTitle(title: string, productType?: string): string {
  const typeInfo = productType ? getProductTypeInfo(productType) : null;

  if (typeInfo) {
    const full = `${title} - ${typeInfo.suffix} | Crazy Gels`;
    if (full.length <= 60) return full;
    // If too long, try without the suffix
    const shorter = `${title} | ${typeInfo.suffix}`;
    if (shorter.length <= 60) return shorter;
  }

  const fallback = `${title} | Crazy Gels`;
  return fallback.length <= 60 ? fallback : `${title.slice(0, 47)}... | Crazy Gels`;
}

/**
 * Builds an SEO-optimized meta description.
 * Targets 140-155 characters, includes keywords and a CTA.
 */
export function buildSeoDescription(
  title: string,
  description: string,
  productType?: string,
  price?: string,
): string {
  const typeInfo = productType ? getProductTypeInfo(productType) : null;

  if (typeInfo) {
    const category = typeInfo.category.toLowerCase();
    const priceStr = price ? ` From ${price}.` : '';

    // Attempt keyword-rich description
    if (category === 'nails') {
      const desc = `Shop ${title} semi-cured gel nail strips at Crazy Gels.${priceStr} Easy DIY application, lasts 2+ weeks, zero damage. Free shipping over $50.`;
      if (desc.length <= 160) return desc;
    }
    if (category === 'hair') {
      const desc = `Shop ${title} at Crazy Gels.${priceStr} Premium hair care for healthy, beautiful hair. Free shipping on orders over $50.`;
      if (desc.length <= 160) return desc;
    }
    if (category === 'skin') {
      const desc = `Shop ${title} at Crazy Gels.${priceStr} Luxury skincare crafted with premium ingredients for radiant results. Free shipping over $50.`;
      if (desc.length <= 160) return desc;
    }
  }

  // Fallback: use product description trimmed to 155 chars + CTA
  if (description && description.length > 20) {
    const cleaned = description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    const trimmed = cleaned.length > 120 ? cleaned.slice(0, 117) + '...' : cleaned;
    return `${trimmed} Shop now at Crazy Gels. Free shipping over $50.`;
  }

  return `Shop ${title} at Crazy Gels. Premium beauty products with free shipping on orders over $50.`;
}

/**
 * Generates complete Product structured data (JSON-LD) for Google rich results.
 * Includes pricing, availability, brand, images, and breadcrumb.
 */
export function buildProductJsonLd(product: {
  title: string;
  description: string;
  handle: string;
  productType?: string;
  vendor?: string;
  availableForSale: boolean;
  featuredImage?: { url: string; width?: number; height?: number; altText?: string };
  images: { edges: { node: { url: string } }[] };
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
    maxVariantPrice: { amount: string; currencyCode: string };
  };
  variants: {
    edges: {
      node: {
        id: string;
        title: string;
        availableForSale: boolean;
        price: { amount: string; currencyCode: string };
        compareAtPrice?: { amount: string; currencyCode: string } | null;
      };
    }[];
  };
}) {
  const price = product.priceRange.minVariantPrice;
  const comparePrice = product.priceRange.maxVariantPrice;
  const typeInfo = product.productType ? getProductTypeInfo(product.productType) : null;

  const offers = product.variants.edges.map((edge) => ({
    '@type': 'Offer' as const,
    url: `https://crazygels.com/products/${product.handle}`,
    priceCurrency: edge.node.price.currencyCode,
    price: edge.node.price.amount,
    ...(edge.node.compareAtPrice && {
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }),
    availability: edge.node.availableForSale
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization' as const,
      name: 'Crazy Gels',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.replace(/<[^>]*>/g, '').slice(0, 500),
    url: `https://crazygels.com/products/${product.handle}`,
    image: product.images.edges.map((img) => img.node.url),
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Crazy Gels',
    },
    ...(typeInfo && { category: typeInfo.category }),
    sku: product.variants.edges[0]?.node.id?.split('/').pop(),
    offers:
      offers.length === 1
        ? offers[0]
        : {
            '@type': 'AggregateOffer',
            priceCurrency: price.currencyCode,
            lowPrice: price.amount,
            highPrice: comparePrice.amount,
            offerCount: offers.length,
            offers,
          },
  };
}

/**
 * Generates BreadcrumbList structured data for product pages.
 */
export function buildBreadcrumbJsonLd(
  productTitle: string,
  productHandle: string,
  productType?: string,
) {
  const items: { name: string; url: string }[] = [
    { name: 'Home', url: 'https://crazygels.com' },
    { name: 'Collections', url: 'https://crazygels.com/collections' },
  ];

  if (productType) {
    const typeHandle = productType.toLowerCase().replace(/\s+/g, '-');
    items.push({
      name: productType,
      url: `https://crazygels.com/collections/${typeHandle}`,
    });
  }

  items.push({
    name: productTitle,
    url: `https://crazygels.com/products/${productHandle}`,
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generates CollectionPage + BreadcrumbList structured data for collection pages.
 * Helps Google show rich results for category pages.
 */
export function buildCollectionJsonLd(collection: {
  title: string;
  handle: string;
  description?: string;
  image?: { url: string } | null;
  products?: { title: string; handle: string; featuredImage?: { url: string } | null; priceRange: { minVariantPrice: { amount: string; currencyCode: string } } }[];
}) {
  const url = `https://crazygels.com/collections/${collection.handle}`;

  const collectionPageLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: collection.title,
    url,
    ...(collection.description && { description: collection.description.replace(/<[^>]*>/g, '').slice(0, 300) }),
    ...(collection.image?.url && { image: collection.image.url }),
    isPartOf: {
      '@type': 'WebSite',
      name: 'Crazy Gels',
      url: 'https://crazygels.com',
    },
  };

  // Add product listing as ItemList if products are provided
  if (collection.products && collection.products.length > 0) {
    collectionPageLd.mainEntity = {
      '@type': 'ItemList',
      numberOfItems: collection.products.length,
      itemListElement: collection.products.slice(0, 20).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: product.title,
        url: `https://crazygels.com/products/${product.handle}`,
        ...(product.featuredImage?.url && { image: product.featuredImage.url }),
      })),
    };
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://crazygels.com' },
      { '@type': 'ListItem', position: 2, name: 'Collections', item: 'https://crazygels.com/collections' },
      { '@type': 'ListItem', position: 3, name: collection.title, item: url },
    ],
  };

  return { collectionPageLd, breadcrumbLd };
}

/**
 * Generates FAQPage structured data -- Google shows these as expandable FAQ cards in search.
 */
export function buildFaqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generates a generic BreadcrumbList for any page path.
 */
export function buildPageBreadcrumbJsonLd(crumbs: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}
