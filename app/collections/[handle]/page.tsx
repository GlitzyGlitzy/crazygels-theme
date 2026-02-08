import { Suspense, cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import Link from 'next/link';
import { getCollection, getCollectionProducts, getAllCollectionProducts, getCollections, getProducts, getAllProducts, isShopifyConfigured } from '@/lib/shopify';

// Deduplicate getAllProducts calls within a single server render.
// React cache() ensures ProductCount + CollectionProducts share ONE fetch
// instead of each making ~16 paginated API calls separately.
const getCachedAllProducts = cache(async (sortKey: string, reverse: boolean) => {
  return getAllProducts({ sortKey, reverse });
});
import { DynamicHeader } from '@/components/layout/dynamic-header';

export const revalidate = 300;
import { Footer } from '@/components/layout/footer';
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid';
import { ChevronLeft, Grid3X3, SlidersHorizontal } from 'lucide-react';
import { CollectionSorting } from '@/components/collections/collection-sorting';
import { FilteredProductGrid } from '@/components/collections/filtered-product-grid';
import { extractFilterOptions } from '@/lib/filter-utils';
import { getSubcategoryCounts } from '@/lib/subcategories';
import { buildCollectionJsonLd } from '@/lib/seo';

// SEO-optimized metadata per collection -- keyword-rich titles and descriptions
const COLLECTION_SEO: Record<string, { title: string; description: string; keywords: string }> = {
  'gel-nail-wraps': {
    title: 'Semi-Cured Gel Nail Wraps - Salon Nails at Home | Crazy Gels',
    description: 'Shop 285+ semi-cured gel nail wraps at Crazy Gels. Easy DIY application, lasts 2+ weeks, zero damage. French tips, nail art, solid colors and more. Free shipping over $50.',
    keywords: 'semi-cured gel nails, gel nail wraps, press on nails, nail strips, DIY gel nails, salon nails at home',
  },
  'french-styles': {
    title: 'French Tip Gel Nails - Classic & Modern Designs | Crazy Gels',
    description: 'Shop French tip semi-cured gel nail wraps. Classic white tips, ombre French, and modern French nail designs. Easy DIY application at home. Free shipping over $50.',
    keywords: 'French tip nails, French gel nails, French manicure, French tip nail wraps',
  },
  nails: {
    title: 'Semi-Cured Gel Nails - Press On Nail Strips | Crazy Gels',
    description: 'Shop premium semi-cured gel nails at Crazy Gels. Salon-quality press on nail strips, easy application, lasts 2+ weeks. 285+ designs. Free shipping over $50.',
    keywords: 'semi-cured gel nails, gel nail strips, press on nails, nail wraps',
  },
  haircare: {
    title: 'Hair Care Products - Shampoo, Treatments & Styling | Crazy Gels',
    description: 'Shop premium hair care products at Crazy Gels. Professional shampoos, conditioners, treatments and styling products for healthy, beautiful hair. Free shipping over $50.',
    keywords: 'hair care products, shampoo, conditioner, hair treatment, hair growth, healthy hair',
  },
  'hair-care': {
    title: 'Hair Care Products - Shampoo, Treatments & Styling | Crazy Gels',
    description: 'Shop premium hair care products at Crazy Gels. Professional shampoos, conditioners, treatments and styling products for healthy, beautiful hair. Free shipping over $50.',
    keywords: 'hair care products, shampoo, conditioner, hair treatment, hair growth',
  },
  skincare: {
    title: 'Skincare Products - Serums, Moisturizers & Masks | Crazy Gels',
    description: 'Shop luxury skincare at Crazy Gels. Premium serums, moisturizers, face masks and treatments for radiant, youthful skin. Free shipping over $50.',
    keywords: 'skincare products, face serum, moisturizer, face mask, anti-aging, skin care',
  },
  'skin-care': {
    title: 'Skincare Products - Serums, Moisturizers & Masks | Crazy Gels',
    description: 'Shop luxury skincare at Crazy Gels. Premium serums, moisturizers, face masks and treatments for radiant, youthful skin. Free shipping over $50.',
    keywords: 'skincare products, face serum, moisturizer, face mask, anti-aging',
  },
  treatments: {
    title: 'Beauty Tools & Treatments - UV Lamps & Nail Kits | Crazy Gels',
    description: 'Shop professional beauty tools and treatments at Crazy Gels. UV lamps, nail prep kits, application tools and accessories for the perfect at-home salon. Free shipping over $50.',
    keywords: 'beauty tools, UV nail lamp, nail kit, gel nail tools, beauty treatments',
  },
  'collagen-masks': {
    title: 'Collagen Face Masks - Anti-Aging & Hydrating | Crazy Gels',
    description: 'Shop collagen face masks at Crazy Gels. Overnight hydrating, firming, and anti-aging face masks crafted with premium ingredients. Free shipping over $50.',
    keywords: 'collagen mask, face mask, anti-aging mask, hydrating mask, overnight mask',
  },
  sets: {
    title: 'Gel Nail Sets & Bundles - Save More | Crazy Gels',
    description: 'Shop gel nail sets and bundles at Crazy Gels. Save on curated sets of semi-cured gel nail wraps, tools and accessories. Free shipping over $50.',
    keywords: 'gel nail sets, nail wrap bundles, nail art kits, gift sets',
  },
  'best-sellers': {
    title: 'Best Selling Gel Nails & Beauty Products | Crazy Gels',
    description: 'Shop our best selling semi-cured gel nails and beauty products. Top-rated by 50K+ customers. Free shipping on orders over $50.',
    keywords: 'best selling nails, popular gel nails, top rated beauty products',
  },
  'new-arrivals': {
    title: 'New Arrivals - Latest Gel Nail Designs | Crazy Gels',
    description: 'Discover the latest semi-cured gel nail designs at Crazy Gels. New arrivals in nail wraps, hair care, and skincare. Free shipping over $50.',
    keywords: 'new gel nails, new nail designs, latest nail art, new arrivals',
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  if (!isShopifyConfigured) {
    return { title: 'Collection | Crazy Gels' };
  }

  const { handle } = await params;

  // Check if it's a virtual collection first
  const virtualDef = VIRTUAL_COLLECTIONS[handle];
  const collection = virtualDef ? null : await getCollection(handle);

  if (!collection && !virtualDef) {
    return { title: 'Collection Not Found | Crazy Gels' };
  }

  // Use pre-written SEO metadata if available, otherwise generate from collection data
  const seo = COLLECTION_SEO[handle.toLowerCase()]

  const collectionTitle = virtualDef?.title || collection?.title || 'Collection';
  const collectionDesc = virtualDef?.description || collection?.description || '';

  const title = seo?.title || collection?.seo?.title || `${collectionTitle} - Shop Online | Crazy Gels`
  const description = seo?.description || collection?.seo?.description || collectionDesc || `Shop our ${collectionTitle} collection at Crazy Gels. Premium beauty products with free shipping over $50.`

  return {
    title,
    description,
    ...(seo?.keywords && { keywords: seo.keywords }),
    alternates: {
      canonical: `https://crazygels.com/collections/${handle}`,
    },
    openGraph: {
      title,
      description,
      url: `https://crazygels.com/collections/${handle}`,
      siteName: 'Crazy Gels',
      images: collection?.image ? [{ url: collection.image.url }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/collections/${handle}`,
    },
  };
}

export async function generateStaticParams() {
  if (!isShopifyConfigured) {
    return [
      { handle: 'gel-nail-wraps' }, { handle: 'french-styles' }, { handle: 'nails' },
      { handle: 'haircare' }, { handle: 'hair-care' },
      { handle: 'skincare' }, { handle: 'skin-care' },
      { handle: 'collagen-masks' }, { handle: 'treatments' },
      { handle: 'sets' }, { handle: 'best-sellers' }, { handle: 'new-arrivals' },
    ];
  }

  try {
    const collections = await getCollections();
    const params = collections.map((collection) => ({
      handle: collection.handle,
    }));
    // Always include virtual collections
    const virtualHandles = ['collagen-masks', 'sets', 'best-sellers', 'new-arrivals'];
    for (const vh of virtualHandles) {
      if (!params.some(p => p.handle === vh)) {
        params.push({ handle: vh });
      }
    }
    return params;
  } catch {
    return [
      { handle: 'gel-nail-wraps' }, { handle: 'french-styles' }, { handle: 'nails' },
      { handle: 'haircare' }, { handle: 'skincare' },
      { handle: 'collagen-masks' }, { handle: 'treatments' },
    ];
  }
}

// Virtual collections: curated sets filtered from the full Shopify catalog
const VIRTUAL_COLLECTIONS: Record<string, { title: string; description: string; image: string; keywords: string[] }> = {
  'collagen-masks': {
    title: 'Collagen Masks',
    description: 'Luxurious overnight collagen face masks for radiant, youthful skin. Hydrating, firming, and anti-aging masks crafted with premium ingredients.',
    image: '/images/collagen-masks.jpg',
    keywords: ['collagen', 'mask', 'face mask', 'overnight mask', 'sleeping mask', 'sheet mask', 'peel off', 'clay mask'],
  },
};

// Keyword-based augmentation: catch products not manually assigned to a Shopify collection
const COLLECTION_KEYWORDS: Record<string, string[]> = {
  'gel-nail-wraps': [
    'gel nail', 'nail wrap', 'semi-cured', 'gel strip', 'nail sticker', 'nail art',
    'nail design', 'gel sticker', 'nail gel', 'gel wrap', 'semi cured', 'nail polish strip',
    'gel polish strip', 'uv gel nail', 'led nail', 'nail decal', 'manicure',
  ],
  'french-styles': [
    'french tip', 'french style', 'french nail', 'french manicure', 'french gel',
    'french design', 'french wrap',
  ],
  haircare: [
    'hair', 'shampoo', 'conditioner', 'scalp', 'keratin', 'argan', 'biotin',
    'hair mask', 'hair oil', 'hair serum', 'hair growth', 'hair treatment',
    'leave-in', 'heat protect', 'hair care', 'haircare', 'styling',
    'curl', 'frizz', 'volume', 'extensions', 'wig', 'ponytail', 'clip-in',
  ],
  skincare: [
    'skin', 'face', 'facial', 'serum', 'moisturizer', 'cleanser', 'toner',
    'retinol', 'vitamin c', 'hyaluronic', 'spf', 'sunscreen', 'anti-aging',
    'brightening', 'exfoliant', 'cream', 'lotion', 'eye cream', 'oil',
    'essence', 'mist', 'glow', 'skincare', 'skin care', 'derma',
  ],
  treatments: [
    'treatment', 'uv lamp', 'led lamp', 'nail lamp', 'nail prep', 'base coat',
    'top coat', 'cuticle', 'nail file', 'buffer', 'remover', 'acetone',
    'nail tool', 'application kit', 'nail kit', 'beauty tool', 'accessory',
  ],
};

function matchesCollectionKeywords(product: { title: string; description: string; tags: string[]; productType: string }, handle: string): boolean {
  const keywords = COLLECTION_KEYWORDS[handle];
  if (!keywords) return false;
  const text = `${product.title} ${product.description} ${product.tags?.join(' ') || ''} ${product.productType || ''}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; order?: string }>;
}) {
  if (!isShopifyConfigured) {
    return <CollectionNotConfigured />;
  }

  const { handle } = await params;
  const { sort, order } = await searchParams;

  // Check if this is a virtual collection
  const virtualDef = VIRTUAL_COLLECTIONS[handle];

  let collection;
  if (virtualDef) {
    // Build a virtual collection object
    collection = {
      handle,
      title: virtualDef.title,
      description: virtualDef.description,
      seo: { title: virtualDef.title, description: virtualDef.description },
      updatedAt: new Date().toISOString(),
      image: { url: virtualDef.image, altText: virtualDef.title, width: 1200, height: 800 },
    };
  } else {
    collection = await getCollection(handle);
  }

  if (!collection) {
    notFound();
  }

  const sortKey = sort?.toUpperCase() || 'BEST_SELLING';
  const reverse = order === 'desc';

  // Generate collection JSON-LD with BreadcrumbList and ItemList
  const { collectionPageLd, breadcrumbLd } = buildCollectionJsonLd({
    title: collection.title,
    handle,
    description: collection.description,
    image: collection.image,
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPageLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <Suspense fallback={<div className="h-16 md:h-20 bg-[#FAF7F2] border-b border-[#B76E79]/20" />}>
        <DynamicHeader />
      </Suspense>

      <main>
        {/* Collection Header */}
        <section className="relative overflow-hidden">
          {collection.image ? (
            <div className="absolute inset-0">
            <img
              src={collection.image.url}
              alt={collection.image.altText || collection.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
              <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/60 via-[#FAF7F2]/80 to-[#FAF7F2]" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/5 via-[#FAF7F2] to-[#C9A9A6]/5" />
          )}

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
            <nav aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-[#2C2C2C]/60 mb-6">
                <li><Link href="/" className="hover:text-[#B76E79] transition-colors">Home</Link></li>
                <li aria-hidden="true">/</li>
                <li><Link href="/collections" className="hover:text-[#B76E79] transition-colors">Collections</Link></li>
                <li aria-hidden="true">/</li>
                <li className="text-[#2C2C2C]" aria-current="page">{collection.title}</li>
              </ol>
            </nav>

            <h1 className="text-4xl font-light tracking-tight text-[#2C2C2C] sm:text-5xl lg:text-6xl">
              {collection.title}
            </h1>

            {collection.description && (
              <p className="mt-4 max-w-2xl text-lg text-[#2C2C2C]/70 text-pretty">
                {collection.description}
              </p>
            )}
          </div>
        </section>

        {/* Products */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Suspense fallback={<div className="h-6 w-32 animate-pulse rounded bg-[#E8E4DC]" />}>
              <ProductCount handle={handle} sortKey={sortKey} reverse={reverse} />
            </Suspense>
            <CollectionSorting currentSort={sort} currentOrder={order} />
          </div>

          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <CollectionProducts handle={handle} sortKey={sortKey} reverse={reverse} />
          </Suspense>
        </section>

        {/* Related Collections */}
        <Suspense fallback={null}>
          <RelatedCollections currentHandle={handle} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

async function ProductCount({
  handle,
  sortKey,
  reverse,
}: {
  handle: string;
  sortKey: string;
  reverse: boolean;
}) {
  const allProducts = await getCachedAllProducts(sortKey, reverse);
  const keywords = VIRTUAL_COLLECTIONS[handle]?.keywords || COLLECTION_KEYWORDS[handle];

  let products;
  if (keywords) {
    products = allProducts.filter((p) => {
      const text = `${p.title} ${p.description} ${p.tags?.join(' ') || ''} ${p.productType || ''}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  } else {
    products = await getAllCollectionProducts({ handle, sortKey, reverse });
  }
  return (
    <p className="text-[#2C2C2C]/60">
      <span className="font-semibold text-[#2C2C2C]">{products.length}</span> products
    </p>
  );
}

async function CollectionProducts({
  handle,
  sortKey,
  reverse,
  }: {
  handle: string;
  sortKey: string;
  reverse: boolean;
  }) {
  const allProducts = await getCachedAllProducts(sortKey, reverse);
  const keywords = VIRTUAL_COLLECTIONS[handle]?.keywords || COLLECTION_KEYWORDS[handle];

  let products;
  if (keywords) {
    products = allProducts.filter((p) => {
      const text = `${p.title} ${p.description} ${p.tags?.join(' ') || ''} ${p.productType || ''}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw.toLowerCase()));
    });
  } else {
    products = await getAllCollectionProducts({ handle, sortKey, reverse });
  }

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#B76E79]/20 bg-[#FFFEF9]">
        <div className="mb-4 h-16 w-16 rounded-full bg-[#B76E79]/20 flex items-center justify-center">
          <Grid3X3 className="h-8 w-8 text-[#B76E79]" />
        </div>
        <h3 className="text-lg font-semibold text-[#2C2C2C]">No products found</h3>
        <p className="mt-2 text-[#2C2C2C]/60">Check back soon for new arrivals</p>
        <Link
          href="/collections"
          className="mt-6 rounded-full bg-[#B76E79] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#A15D67]"
        >
          Browse All Collections
        </Link>
      </div>
    );
  }

  const filterOptions = extractFilterOptions(products);
  const subcategoryCounts = getSubcategoryCounts(products, handle);

  return (
    <FilteredProductGrid
      products={products}
      filterOptions={filterOptions}
      collectionHandle={handle}
      subcategoryCounts={subcategoryCounts}
    />
  );
}

async function RelatedCollections({ currentHandle }: { currentHandle: string }) {
  try {
    const collections = await getCollections();
    const related = collections
      .filter((c) => c.handle !== currentHandle && c.handle !== 'frontpage' && c.handle !== 'all')
      .slice(0, 3);

    if (related.length === 0) return null;

    return (
      <section className="border-t border-[#B76E79]/10 bg-[#FFFEF9] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-medium text-[#2C2C2C]">Explore More Collections</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((collection) => (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                className="group relative flex aspect-[16/9] flex-col justify-end overflow-hidden rounded-2xl bg-[#FFFEF9] border border-[#B76E79]/20"
              >
                {collection.image ? (
                  <img
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/20 to-[#C9A9A6]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9]/90 via-[#FFFEF9]/40 to-transparent" />
                <div className="relative p-6">
                  <h3 className="text-xl font-medium text-[#2C2C2C] group-hover:text-[#B76E79] transition-colors">
                    {collection.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

function CollectionNotConfigured() {
  return (
    <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#B76E79]/20 flex items-center justify-center">
          <SlidersHorizontal className="h-10 w-10 text-[#B76E79]" />
        </div>
        <h1 className="text-2xl font-medium text-[#2C2C2C] mb-4">Connect Your Shopify Store</h1>
        <p className="text-[#2C2C2C]/60 mb-8">
          Add your Shopify credentials to display collections and products.
        </p>
        <div className="bg-[#FFFEF9] rounded-xl p-6 text-left border border-[#B76E79]/20">
          <p className="text-[#2C2C2C]/40 text-sm mb-3">Required environment variables:</p>
          <code className="block text-[#A15D67] text-sm mb-1">SHOPIFY_STORE_DOMAIN</code>
          <code className="block text-[#A15D67] text-sm">SHOPIFY_STOREFRONT_ACCESS_TOKEN</code>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-[#B76E79] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
