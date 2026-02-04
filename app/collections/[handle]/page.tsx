import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getCollection, getCollectionProducts, getAllCollectionProducts, getCollections, isShopifyConfigured } from '@/lib/shopify';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid';
import { ChevronLeft, Grid3X3, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { CollectionSorting } from '@/components/collections/collection-sorting';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  if (!isShopifyConfigured) {
    return { title: 'Collection | Crazy Gels' };
  }

  const { handle } = await params;
  const collection = await getCollection(handle);

  if (!collection) {
    return { title: 'Collection Not Found | Crazy Gels' };
  }

  return {
    title: `${collection.title} | Crazy Gels`,
    description: collection.description || `Shop our ${collection.title} collection at Crazy Gels`,
    openGraph: {
      title: collection.title,
      description: collection.description || `Shop our ${collection.title} collection`,
      images: collection.image ? [{ url: collection.image.url }] : [],
    },
  };
}

// Static params for common collections
export async function generateStaticParams() {
  if (!isShopifyConfigured) {
    return [{ handle: 'nails' }, { handle: 'hair' }, { handle: 'skin' }];
  }

  try {
    const collections = await getCollections();
    return collections.map((collection) => ({
      handle: collection.handle,
    }));
  } catch {
    return [{ handle: 'nails' }, { handle: 'hair' }, { handle: 'skin' }];
  }
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

  const collection = await getCollection(handle);

  if (!collection) {
    notFound();
  }

  // Map sort params to Shopify sort keys
  const sortKey = sort?.toUpperCase() || 'BEST_SELLING';
  const reverse = order === 'desc';

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <DynamicHeader />
      <main>
      {/* Collection Header */}
      <section className="relative overflow-hidden">
        {/* Background */}
        {collection.image ? (
          <div className="absolute inset-0">
            <Image
              src={collection.image.url}
              alt={collection.image.altText || collection.title}
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#FAF7F2]/60 via-[#FAF7F2]/80 to-[#FAF7F2]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-[#FAF7F2] to-[#C9A9A6]/5" />
        )}

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#2C2C2C]/60 transition-colors hover:text-[#D4AF37]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-light tracking-tight text-[#2C2C2C] sm:text-5xl lg:text-6xl">
            {collection.title}
          </h1>

          {collection.description && (
            <p className="mt-4 max-w-2xl text-lg text-[#2C2C2C]/70">
              {collection.description}
            </p>
          )}
        </div>
      </section>

      {/* Products Section */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Suspense fallback={<div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />}>
            <ProductCount handle={handle} sortKey={sortKey} reverse={reverse} />
          </Suspense>

          <div className="flex items-center gap-4">
            <CollectionSorting currentSort={sort} currentOrder={order} />
          </div>
        </div>

        {/* Products Grid */}
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
  const products = await getAllCollectionProducts({ handle, sortKey, reverse });
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
  const products = await getAllCollectionProducts({ handle, sortKey, reverse });

  if (products.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#FFFEF9]">
        <div className="mb-4 h-16 w-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <Grid3X3 className="h-8 w-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-lg font-semibold text-[#2C2C2C]">No products found</h3>
        <p className="mt-2 text-[#2C2C2C]/60">Check back soon for new arrivals</p>
        <Link
          href="/collections"
          className="mt-6 rounded-full bg-[#D4AF37] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B8860B]"
        >
          Browse All Collections
        </Link>
      </div>
    );
  }

  return <ProductGrid products={products} />;
}

async function RelatedCollections({ currentHandle }: { currentHandle: string }) {
  try {
    const collections = await getCollections();
    const related = collections.filter((c) => c.handle !== currentHandle).slice(0, 3);

    if (related.length === 0) return null;

    return (
      <section className="border-t border-[#D4AF37]/10 bg-[#FFFEF9] py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-medium text-[#2C2C2C]">Explore More Collections</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((collection) => (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
                className="group relative flex aspect-[16/9] flex-col justify-end overflow-hidden rounded-2xl bg-[#FFFEF9] border border-[#D4AF37]/20"
              >
                {collection.image ? (
                  <Image
                    src={collection.image.url}
                    alt={collection.image.altText || collection.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/20 to-[#C9A9A6]/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9]/90 via-[#FFFEF9]/40 to-transparent" />
                <div className="relative p-6">
                  <h3 className="text-xl font-medium text-[#2C2C2C] group-hover:text-[#D4AF37] transition-colors">
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
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
          <SlidersHorizontal className="h-10 w-10 text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-medium text-[#2C2C2C] mb-4">Connect Your Shopify Store</h1>
        <p className="text-[#2C2C2C]/60 mb-8">
          Add your Shopify credentials to display collections and products.
        </p>
        <div className="bg-[#FFFEF9] rounded-xl p-6 text-left border border-[#D4AF37]/20">
          <p className="text-[#2C2C2C]/40 text-sm mb-3">Required environment variables:</p>
          <code className="block text-[#B8860B] text-sm mb-1">SHOPIFY_STORE_DOMAIN</code>
          <code className="block text-[#B8860B] text-sm">SHOPIFY_STOREFRONT_ACCESS_TOKEN</code>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 text-[#D4AF37] hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </main>
  );
}
