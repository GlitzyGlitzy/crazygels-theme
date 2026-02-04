import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getProducts, isShopifyConfigured } from '@/lib/shopify';
import { ProductGallery } from '@/components/products/product-gallery';
import { ProductInfo } from '@/components/products/product-info';
import { ProductGrid } from '@/components/products/product-grid';
import Link from 'next/link';
import { ChevronLeft, Truck, Shield, RotateCcw, Star } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  if (!isShopifyConfigured) {
    return { title: 'Product | Crazy Gels' };
  }
  
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${product.title} | Crazy Gels`,
    description: product.seo?.description || product.description,
    openGraph: {
      title: product.title,
      description: product.description,
      images: product.featuredImage
        ? [
            {
              url: product.featuredImage.url,
              width: product.featuredImage.width,
              height: product.featuredImage.height,
              alt: product.featuredImage.altText,
            },
          ]
        : [],
    },
  };
}

// Generate Product JSON-LD for SEO rich results
function generateProductJsonLd(product: Awaited<ReturnType<typeof getProduct>>) {
  if (!product) return null;
  
  const price = product.priceRange.minVariantPrice;
  const comparePrice = product.priceRange.maxVariantPrice;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map(img => img.url),
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Crazy Gels',
    },
    sku: product.variants[0]?.id,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: price.currencyCode,
      lowPrice: price.amount,
      highPrice: comparePrice.amount,
      availability: product.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Crazy Gels',
      },
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  if (!isShopifyConfigured) {
    notFound();
  }

  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    notFound();
  }

  // Generate JSON-LD for this product
  const productJsonLd = generateProductJsonLd(product);

  // Get related products
  const relatedProducts = await getProducts({
    first: 4,
    query: product.productType ? `product_type:${product.productType}` : undefined,
  });

  // Filter out the current product
  const filteredRelated = relatedProducts.filter((p) => p.handle !== handle).slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      {/* Product JSON-LD for SEO */}
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Shop
          </Link>
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-[#ff00b0]">Crazy</span>
            <span className="text-foreground">Gels</span>
          </Link>
          <div className="w-24" />
        </div>
      </header>

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-4">
        <ol className="flex items-center gap-2 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="transition-colors hover:text-foreground">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/collections/all" className="transition-colors hover:text-foreground">
              Products
            </Link>
          </li>
          <li>/</li>
          <li className="text-foreground">{product.title}</li>
        </ol>
      </nav>

      {/* Product Section */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Gallery */}
          <Suspense
            fallback={
              <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            }
          >
            <ProductGallery product={product} />
          </Suspense>

          {/* Product Info */}
          <Suspense
            fallback={
              <div className="space-y-4">
                <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
                <div className="h-24 animate-pulse rounded bg-muted" />
              </div>
            }
          >
            <ProductInfo product={product} />
          </Suspense>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-y border-border py-8 md:grid-cols-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#ff00b0]/10 p-3">
              <Truck className="h-6 w-6 text-[#ff00b0]" />
            </div>
            <span className="text-sm font-medium">Free Shipping</span>
            <span className="text-xs text-muted-foreground">Orders over $50</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#7c3aed]/10 p-3">
              <Shield className="h-6 w-6 text-[#7c3aed]" />
            </div>
            <span className="text-sm font-medium">Secure Payment</span>
            <span className="text-xs text-muted-foreground">100% Protected</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#ff00b0]/10 p-3">
              <RotateCcw className="h-6 w-6 text-[#ff00b0]" />
            </div>
            <span className="text-sm font-medium">Easy Returns</span>
            <span className="text-xs text-muted-foreground">30-Day Policy</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#7c3aed]/10 p-3">
              <Star className="h-6 w-6 text-[#7c3aed]" />
            </div>
            <span className="text-sm font-medium">Top Rated</span>
            <span className="text-xs text-muted-foreground">50K+ Reviews</span>
          </div>
        </div>

        {/* Product Description */}
        {product.descriptionHtml && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-bold">Product Details</h2>
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </section>
        )}

        {/* Related Products */}
        {filteredRelated.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-8 text-2xl font-bold">You May Also Like</h2>
            <ProductGrid products={filteredRelated} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Crazy Gels. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
