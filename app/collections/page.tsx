import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections, isShopifyConfigured } from '@/lib/shopify';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Collection } from '@/lib/shopify/types';

export const metadata: Metadata = {
  title: 'All Collections | Crazy Gels',
  description: 'Browse our complete collection of premium nail, hair, and skin care products at Crazy Gels',
};

// Default collections when Shopify is not configured
const DEFAULT_COLLECTIONS = [
  {
    handle: 'nails',
    title: 'Nails',
    description: 'Premium nail products for stunning manicures',
    gradient: 'from-[#ff00b0] to-[#ff6b6b]',
  },
  {
    handle: 'hair',
    title: 'Hair',
    description: 'Professional hair care and styling products',
    gradient: 'from-[#7c3aed] to-[#06b6d4]',
  },
  {
    handle: 'skin',
    title: 'Skin',
    description: 'Luxurious skincare for radiant results',
    gradient: 'from-[#06b6d4] to-[#10b981]',
  },
];

export default async function CollectionsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/10 via-[#0a0a0a] to-[#7c3aed]/10" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-[#ff00b0]/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#7c3aed]/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff00b0] to-[#7c3aed]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Collections
            </h1>
          </div>

          <p className="mt-4 max-w-2xl text-lg text-white/70">
            Explore our curated collections of premium beauty products. From stunning nails to luxurious skincare, find everything you need.
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <Suspense fallback={<CollectionsGridSkeleton />}>
          <CollectionsGrid />
        </Suspense>
      </section>
    </main>
  );
}

async function CollectionsGrid() {
  let collections: Collection[] = [];

  if (isShopifyConfigured) {
    try {
      collections = await getCollections();
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    }
  }

  // Show default collections if none found or Shopify not configured
  if (collections.length === 0) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DEFAULT_COLLECTIONS.map((collection) => (
          <Link
            key={collection.handle}
            href={`/collections/${collection.handle}`}
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#111111] transition-all hover:border-[#ff00b0]/50 hover:shadow-xl hover:shadow-[#ff00b0]/10"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${collection.gradient} opacity-20 transition-opacity group-hover:opacity-30`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            <div className="relative p-8">
              <h3 className="text-2xl font-bold text-white group-hover:text-[#ff00b0] transition-colors">
                {collection.title}
              </h3>
              <p className="mt-2 text-white/60">{collection.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff00b0]">
                Shop Now
                <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <Link
          key={collection.handle}
          href={`/collections/${collection.handle}`}
          className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 bg-[#111111] transition-all hover:border-[#ff00b0]/50 hover:shadow-xl hover:shadow-[#ff00b0]/10"
        >
          {collection.image ? (
            <>
              <Image
                src={collection.image.url}
                alt={collection.image.altText || collection.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#ff00b0]/20 to-[#7c3aed]/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
            </>
          )}
          <div className="relative p-8">
            <h3 className="text-2xl font-bold text-white group-hover:text-[#ff00b0] transition-colors">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-white/60">{collection.description}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff00b0]">
              Shop Now
              <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CollectionsGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5" />
      ))}
    </div>
  );
}
