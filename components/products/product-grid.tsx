import Link from 'next/link';
import { Product } from '@/lib/shopify/types';
import { shortenProductTitle, formatPrice } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { handle, title, featuredImage, priceRange, variants, availableForSale } = product;
  const price = priceRange.minVariantPrice;
  const compareAtPrice = variants?.edges?.[0]?.node.compareAtPrice;
  const hasDiscount = compareAtPrice && parseFloat(compareAtPrice.amount) > parseFloat(price.amount);

  return (
    <Link
      href={`/products/${handle}`}
      className="group relative flex flex-col overflow-hidden rounded-xl bg-card transition-all hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {featuredImage?.url ? (
          <img
            src={featuredImage.url}
            alt={featuredImage.altText || title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
        {!availableForSale && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80">
            <span className="rounded-full bg-destructive px-3 py-1 text-sm font-medium text-destructive-foreground">
              Sold Out
            </span>
          </div>
        )}
        {hasDiscount && availableForSale && (
          <div className="absolute left-2 top-2 rounded-full bg-[#B76E79] px-2 py-1 text-xs font-semibold text-white">
            Sale
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <h3
          className="line-clamp-2 text-xs md:text-sm font-medium text-foreground group-hover:text-[#B76E79] transition-colors"
          title={title}
        >
          {shortenProductTitle(title)}
        </h3>
        <div className="mt-1.5 md:mt-2 flex items-center gap-2">
          <span className="text-sm md:text-base font-bold text-foreground">
            {formatPrice(price.amount, price.currencyCode)}
          </span>
          {hasDiscount && (
            <span className="text-xs md:text-sm text-muted-foreground line-through">
              {formatPrice(compareAtPrice.amount, compareAtPrice.currencyCode)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
        No products found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-xl bg-card">
          <div className="aspect-square animate-pulse bg-muted" />
          <div className="p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
