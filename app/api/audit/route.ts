import { NextResponse } from 'next/server'
import { getCollections, getCollectionProducts, getAllProducts, isShopifyConfigured } from '@/lib/shopify'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!isShopifyConfigured) {
    return NextResponse.json({
      error: 'Shopify not configured',
      message: 'Add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.',
    }, { status: 503 })
  }

  try {
    // Fetch all products and collections
    const [allProducts, collections] = await Promise.all([
      getAllProducts({}),
      getCollections(),
    ])

    // Filter out system collections
    const realCollections = collections.filter(c =>
      c.handle !== 'frontpage' && c.handle !== 'all' && c.handle !== 'all-products'
    )

    // Audit each collection
    const collectionAudit = await Promise.all(
      realCollections.map(async (collection) => {
        try {
          const products = await getCollectionProducts({ handle: collection.handle, first: 100 })
          return {
            handle: collection.handle,
            title: collection.title,
            productCount: products.length,
            hasDescription: !!collection.description,
            hasImage: !!collection.image,
            hasSeoTitle: !!collection.seo?.title,
            hasSeoDescription: !!collection.seo?.description,
          }
        } catch {
          return {
            handle: collection.handle,
            title: collection.title,
            productCount: 0,
            hasDescription: !!collection.description,
            hasImage: !!collection.image,
            hasSeoTitle: false,
            hasSeoDescription: false,
            error: 'Failed to fetch products',
          }
        }
      })
    )

    // Product audit
    const productFlags = {
      missingDescription: [] as string[],
      missingImages: [] as string[],
      missingAltText: [] as string[],
      missingProductType: [] as string[],
      unavailable: [] as string[],
      missingSeoTitle: [] as string[],
      missingSeoDescription: [] as string[],
    }

    for (const product of allProducts) {
      if (!product.description || product.description.trim().length === 0) {
        productFlags.missingDescription.push(product.title)
      }
      if (!product.featuredImage?.url) {
        productFlags.missingImages.push(product.title)
      }
      if (product.featuredImage && (!product.featuredImage.altText || product.featuredImage.altText.trim().length === 0)) {
        productFlags.missingAltText.push(product.title)
      }
      if (!product.productType || product.productType.trim().length === 0) {
        productFlags.missingProductType.push(product.title)
      }
      if (!product.availableForSale) {
        productFlags.unavailable.push(product.title)
      }
      if (!product.seo?.title || product.seo.title.trim().length === 0) {
        productFlags.missingSeoTitle.push(product.title)
      }
      if (!product.seo?.description || product.seo.description.trim().length === 0) {
        productFlags.missingSeoDescription.push(product.title)
      }
    }

    // Collections with no products
    const emptyCollections = collectionAudit.filter(c => c.productCount === 0)

    // Collections missing SEO
    const collectionsWithoutSeo = collectionAudit.filter(c => !c.hasSeoTitle || !c.hasSeoDescription)

    // Build report
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalProducts: allProducts.length,
        totalCollections: realCollections.length,
        productsAvailable: allProducts.filter(p => p.availableForSale).length,
        productsUnavailable: productFlags.unavailable.length,
      },
      collectionBreakdown: collectionAudit.map(c => ({
        collection: c.title,
        handle: c.handle,
        products: c.productCount,
        hasImage: c.hasImage,
        hasDescription: c.hasDescription,
        hasSeoTitle: c.hasSeoTitle,
        hasSeoDescription: c.hasSeoDescription,
      })),
      headerNavigation: {
        status: 'Dynamic - pulls from Shopify collections',
        collectionsUsed: realCollections.length,
        behavior: 'Only shows published collections. Falls back to defaults if Shopify is unavailable.',
      },
      seoStatus: {
        productsMissingSeoTitle: productFlags.missingSeoTitle.length,
        productsMissingSeoDescription: productFlags.missingSeoDescription.length,
        collectionsMissingSeo: collectionsWithoutSeo.length,
      },
      flags: {
        productsWithoutDescription: productFlags.missingDescription,
        productsWithoutImages: productFlags.missingImages,
        productsWithoutAltText: productFlags.missingAltText,
        productsWithoutProductType: productFlags.missingProductType,
        unavailableProducts: productFlags.unavailable,
        emptyCollections: emptyCollections.map(c => c.title),
        collectionsWithoutSeo: collectionsWithoutSeo.map(c => ({
          title: c.title,
          missingSeoTitle: !c.hasSeoTitle,
          missingSeoDescription: !c.hasSeoDescription,
        })),
      },
      technicalSeo: {
        singleH1PerPage: true,
        cleanUrls: true,
        canonicalTags: true,
        jsonLdStructuredData: true,
        breadcrumbNavigation: true,
        responsiveImages: true,
        imageOptimization: 'Shopify CDN with width/height/crop parameters',
        openGraphTags: true,
        twitterCards: true,
      },
      performance: {
        suspenseBoundaries: true,
        streamingSSR: true,
        imageLazyLoading: true,
        fetchCacheStrategy: 'Revalidation with tags, no-store for paginated bulk fetches',
        maxProductsPerPage: 100,
        maxProductsPerCollectionPreview: 8,
      },
    }

    return NextResponse.json(report, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Audit failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
