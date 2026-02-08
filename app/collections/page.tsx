import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { getCollections, isShopifyConfigured } from '@/lib/shopify';
export const revalidate = 300;
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { Collection } from '@/lib/shopify/types';

export const metadata: Metadata = {
  title: 'All Collections | Crazy Gels',
  description: 'Browse our complete collection of premium nail, hair, and skin care products at Crazy Gels',
};

// Default collections when Shopify is not configured - luxury palette
const DEFAULT_COLLECTIONS = [
  {
    handle: 'gel-nail-wraps',
    title: 'Gel Nail Wraps',
    description: 'Premium semi-cured gel nail wraps for a salon finish at home',
    gradient: 'from-[#B76E79] to-[#A15D67]',
  },
  {
    handle: 'french-styles',
    title: 'French Styles',
    description: 'Classic and modern French tip gel nail designs',
    gradient: 'from-[#C9A9A6] to-[#A89190]',
  },
  {
    handle: 'haircare',
    title: 'Haircare',
    description: 'Professional hair care and styling products',
    gradient: 'from-[#9E6B73] to-[#8A5560]',
  },
  {
    handle: 'skincare',
    title: 'Skincare',
    description: 'Luxurious skincare for radiant results',
    gradient: 'from-[#B76E79] to-[#9E6B73]',
  },
  {
    handle: 'collagen-masks',
    title: 'Collagen Masks',
    description: 'Luxurious overnight collagen face masks for radiant, youthful skin',
    gradient: 'from-[#B76E79] to-[#C9A9A6]',
  },
  {
    handle: 'treatments',
    title: 'Treatments',
    description: 'Professional beauty treatments and tools',
    gradient: 'from-[#9E6B73] to-[#C9A9A6]',
  },
];

export default async function CollectionsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Suspense fallback={<div className="h-16 md:h-20 bg-[#FAF7F2] border-b border-[#B76E79]/20" />}>
        <DynamicHeader />
      </Suspense>
      <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/5 via-[#FAF7F2] to-[#C9A9A6]/5" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-[#B76E79]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#C9A9A6]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#2C2C2C]/60 transition-colors hover:text-[#B76E79]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#B76E79]">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-light tracking-tight text-[#2C2C2C] sm:text-5xl lg:text-6xl">
              Collections
            </h1>
          </div>

          <p className="mt-4 max-w-2xl text-lg text-[#2C2C2C]/70">
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
      
      <Footer />
    </div>
  );
}

// Virtual collection card with custom image
const VIRTUAL_COLLECTION_CARDS = [
  {
    handle: 'collagen-masks',
    title: 'Collagen Masks',
    description: 'Luxurious overnight collagen face masks for radiant, youthful skin',
    image: '/images/collagen-masks.jpg',
  },
];

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
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-[#B76E79]/20 bg-[#FFFEF9] transition-all hover:border-[#B76E79]/50 hover:shadow-xl hover:shadow-[#B76E79]/10"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${collection.gradient} opacity-10 transition-opacity group-hover:opacity-20`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/50 to-transparent" />
            <div className="relative p-8">
              <h3 className="text-2xl font-medium text-[#2C2C2C] group-hover:text-[#B76E79] transition-colors">
                {collection.title}
              </h3>
              <p className="mt-2 text-[#2C2C2C]/60">{collection.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B76E79]">
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
  {/* Virtual collection cards with custom images */}
  {VIRTUAL_COLLECTION_CARDS.map((vc) => (
    <Link
      key={vc.handle}
      href={`/collections/${vc.handle}`}
      className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-[#B76E79]/20 bg-[#FFFEF9] transition-all hover:border-[#B76E79]/50 hover:shadow-xl hover:shadow-[#B76E79]/10"
    >
      <img
        src={vc.image}
        alt={vc.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/60 to-transparent" />
      <div className="relative p-8">
        <h3 className="text-2xl font-medium text-[#2C2C2C] group-hover:text-[#B76E79] transition-colors">
          {vc.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[#2C2C2C]/60">{vc.description}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B76E79]">
          Shop Now
          <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  ))}
  {/* Shopify collection cards */}
  {collections.map((collection) => {
  return (
  <Link
  key={collection.handle}
  href={`/collections/${collection.handle}`}
  className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-[#B76E79]/20 bg-[#FFFEF9] transition-all hover:border-[#B76E79]/50 hover:shadow-xl hover:shadow-[#B76E79]/10"
          >
            {collection.image?.url ? (
              <>
                <img
                  src={collection.image.url}
                  alt={collection.image.altText || collection.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/60 to-transparent" />
              </>
            ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#B76E79]/10 to-[#C9A9A6]/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/50 to-transparent" />
            </>
          )}
          <div className="relative p-8">
            <h3 className="text-2xl font-medium text-[#2C2C2C] group-hover:text-[#B76E79] transition-colors">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-[#2C2C2C]/60">{collection.description}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B76E79]">
              Shop Now
              <ChevronLeft className="h-4 w-4 rotate-180 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </Link>
        );
      })}
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
