import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProduct, getCollectionProducts, isShopifyConfigured } from '@/lib/shopify';
import { ProductGallery } from '@/components/products/product-gallery';

export const revalidate = 300;
import { ProductInfo } from '@/components/products/product-info';
import { ProductGrid, ProductGridSkeleton } from '@/components/products/product-grid';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';
import Link from 'next/link';
import { Truck, Shield, RotateCcw, Star } from 'lucide-react';

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
    return { title: 'Product Not Found | Crazy Gels' };
  }

  // Build SEO-optimized title (max 60 chars)
  const seoTitle = product.seo?.title || `${product.title} | Crazy Gels`
  const seoDescription = product.seo?.description || product.description?.slice(0, 155) || `Shop ${product.title} at Crazy Gels. Premium beauty products with free shipping over $50.`

  return {
    title: seoTitle,
    description: seoDescription,
    openGraph: {
      title: product.title,
      description: seoDescription,
      type: 'website',
      images: product.featuredImage
        ? [
            {
              url: product.featuredImage.url,
              width: product.featuredImage.width,
              height: product.featuredImage.height,
              alt: product.featuredImage.altText || product.title,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: seoDescription,
    },
    alternates: {
      canonical: `/products/${handle}`,
    },
  };
}

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
    sku: product.variants.edges[0]?.node.id,
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

  const productJsonLd = generateProductJsonLd(product);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {productJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
        />
      )}

      <Suspense fallback={<div className="h-16 md:h-20 bg-[#FAF7F2] border-b border-[#B76E79]/20" />}>
        <DynamicHeader />
      </Suspense>

      {/* Breadcrumb */}
      <nav className="mx-auto max-w-7xl px-4 py-4" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm text-[#2C2C2C]/60">
          <li><Link href="/" className="hover:text-[#B76E79] transition-colors">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/collections" className="hover:text-[#B76E79] transition-colors">Collections</Link></li>
          {product.productType && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/collections/${product.productType.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#B76E79] transition-colors">
                  {product.productType}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="text-[#2C2C2C] line-clamp-1" aria-current="page">{product.title}</li>
        </ol>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <ProductGallery product={product} />
          <ProductInfo product={product} />
        </div>

        {/* Trust Badges */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-y border-[#B76E79]/10 py-8 md:grid-cols-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#B76E79]/10 p-3">
              <Truck className="h-6 w-6 text-[#B76E79]" />
            </div>
            <span className="text-sm font-medium text-[#2C2C2C]">Free Shipping</span>
            <span className="text-xs text-[#2C2C2C]/60">Orders over $50</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#9E6B73]/10 p-3">
              <Shield className="h-6 w-6 text-[#9E6B73]" />
            </div>
            <span className="text-sm font-medium text-[#2C2C2C]">Secure Payment</span>
            <span className="text-xs text-[#2C2C2C]/60">100% Protected</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#B76E79]/10 p-3">
              <RotateCcw className="h-6 w-6 text-[#B76E79]" />
            </div>
            <span className="text-sm font-medium text-[#2C2C2C]">Easy Returns</span>
            <span className="text-xs text-[#2C2C2C]/60">14-Day Policy</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-full bg-[#9E6B73]/10 p-3">
              <Star className="h-6 w-6 text-[#9E6B73]" />
            </div>
            <span className="text-sm font-medium text-[#2C2C2C]">Top Rated</span>
            <span className="text-xs text-[#2C2C2C]/60">Trusted by 50K+</span>
          </div>
        </div>

        {/* Product Description */}
        {product.descriptionHtml && (
          <section className="mt-12">
            <h2 className="mb-4 text-2xl font-medium text-[#2C2C2C]">Product Details</h2>
            <div
              className="prose prose-neutral max-w-none text-[#2C2C2C]/80"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          </section>
        )}

        {/* Related Products */}
        <Suspense fallback={<ProductGridSkeleton count={4} />}>
          <RelatedProducts handle={handle} productType={product.productType} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}

async function RelatedProducts({ handle, productType }: { handle: string; productType?: string }) {
  if (!productType) return null

  try {
    // Fetch related products from the same product type collection
    const typeHandle = productType.toLowerCase().replace(/\s+/g, '-')
    const related = await getCollectionProducts({
      handle: typeHandle,
      first: 5,
    })

    const filtered = related.filter((p) => p.handle !== handle).slice(0, 4)

    if (filtered.length === 0) return null

    return (
      <section className="mt-16">
        <h2 className="mb-8 text-2xl font-medium text-[#2C2C2C]">You May Also Like</h2>
        <ProductGrid products={filtered} />
      </section>
    )
  } catch {
    return null
  }
}
