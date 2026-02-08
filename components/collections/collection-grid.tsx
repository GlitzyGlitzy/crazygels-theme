
import Link from 'next/link';
import Image from 'next/image';
import { Collection } from '@/lib/shopify/types';

export function CollectionCard({ collection }: { collection: Collection }) {
  const { handle, title, description, image } = collection;

  return (
    <Link
      href={`/collections/${handle}`}
      className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-xl bg-card"
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.altText || title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
      <div className="relative p-6">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </Link>
  );
}

export function CollectionGrid({ collections }: { collections: Collection[] }) {
  if (collections.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        No collections found
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {collections.map((collection) => (
        <CollectionCard key={collection.handle} collection={collection} />
      ))}
    </div>
  );
}

export function CollectionGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
