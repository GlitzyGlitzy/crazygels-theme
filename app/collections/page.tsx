import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getCollections, isShopifyConfigured } from '@/lib/shopify';
import { getOptimizedImageUrl } from '@/lib/shopify/image';
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
    handle: 'nails',
    title: 'Nails',
    description: 'Premium nail products for stunning manicures',
    gradient: 'from-[#D4AF37] to-[#B8860B]',
  },
  {
    handle: 'hair',
    title: 'Hair',
    description: 'Professional hair care and styling products',
    gradient: 'from-[#8B7355] to-[#6B5344]',
  },
  {
    handle: 'skin',
    title: 'Skin',
    description: 'Luxurious skincare for radiant results',
    gradient: 'from-[#C9A9A6] to-[#A89190]',
  },
];

export default async function CollectionsPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <Suspense fallback={<div className="h-16 md:h-20 bg-[#FAF7F2] border-b border-[#D4AF37]/20" />}>
        <DynamicHeader />
      </Suspense>
      <main>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 via-[#FAF7F2] to-[#C9A9A6]/5" />
        <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-[#C9A9A6]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-[#2C2C2C]/60 transition-colors hover:text-[#D4AF37]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4AF37]">
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
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#FFFEF9] transition-all hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${collection.gradient} opacity-10 transition-opacity group-hover:opacity-20`} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/50 to-transparent" />
            <div className="relative p-8">
              <h3 className="text-2xl font-medium text-[#2C2C2C] group-hover:text-[#D4AF37] transition-colors">
                {collection.title}
              </h3>
              <p className="mt-2 text-[#2C2C2C]/60">{collection.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
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
      {collections.map((collection) => {
        // Get optimized image URL for collection cards (800px for crisp quality)
        const optimizedImageUrl = collection.image?.url 
          ? getOptimizedImageUrl(collection.image.url, { width: 800, height: 600, crop: 'center' })
          : null;
          
        return (
          <Link
            key={collection.handle}
            href={`/collections/${collection.handle}`}
            className="group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-[#FFFEF9] transition-all hover:border-[#D4AF37]/50 hover:shadow-xl hover:shadow-[#D4AF37]/10"
          >
            {optimizedImageUrl ? (
              <>
                <Image
                  src={optimizedImageUrl}
                  alt={collection.image?.altText || collection.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  quality={85}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEEAQQDAAAAAAAAAAAAAQIDAAQFESEGEhMxQVFh/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAZEQACAwEAAAAAAAAAAAAAAAABAgADESH/2gAMAwEAAhEDEEA/ANBw+Vt8fPLLFb26SPpWcRKCwHvZ96rUUq5BzchfS5r/2Q=="
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/60 to-transparent" />
              </>
            ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-[#C9A9A6]/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#FFFEF9] via-[#FFFEF9]/50 to-transparent" />
            </>
          )}
          <div className="relative p-8">
            <h3 className="text-2xl font-medium text-[#2C2C2C] group-hover:text-[#D4AF37] transition-colors">
              {collection.title}
            </h3>
            {collection.description && (
              <p className="mt-2 line-clamp-2 text-[#2C2C2C]/60">{collection.description}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37]">
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
