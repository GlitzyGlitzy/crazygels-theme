import { SHOPIFY_GRAPHQL_API_ENDPOINT, TAGS, RATE_LIMIT, CACHE_TIMES } from './constants';
import {
  Cart,
  Collection,
  Connection,
  Image,
  Product,
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct,
  Blog,
  BlogArticle,
  ShopifyBlog,
  ShopifyBlogArticle,
} from './types';

// Default country for @inContext directive (Germany = primary market)
// Shopify returns presentment prices for this country's market
const DEFAULT_COUNTRY = 'DE';

const rawDomain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const rawToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const domain =
  rawDomain && rawDomain !== 'undefined' && rawDomain.trim().length > 0
    ? rawDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    : '';
const storefrontAccessToken =
  rawToken && rawToken !== 'undefined' && rawToken.trim().length > 0 ? rawToken.trim() : '';

const hasValidDomain = domain.includes('myshopify.com');
const hasValidToken = storefrontAccessToken.length > 20;

export const isShopifyConfigured = Boolean(hasValidDomain && hasValidToken);

const endpoint = isShopifyConfigured ? `https://${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}` : '';

type ExtractVariables<T> = T extends { variables: object } ? T['variables'] : never;

let lastRequestTime = 0;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const requestQueue: (() => void)[] = [];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let isProcessingQueue = false;

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  const minInterval = 1000 / RATE_LIMIT.MAX_REQUESTS_PER_SECOND;
  if (timeSinceLastRequest < minInterval) {
    await new Promise((resolve) => setTimeout(resolve, minInterval - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function shopifyFetch<T>({
  cache,
  headers,
  query,
  tags,
  variables,
  revalidate,
}: {
  cache?: RequestCache;
  headers?: HeadersInit;
  query: string;
  tags?: string[];
  variables?: ExtractVariables<T>;
  revalidate?: number;
}): Promise<{ status: number; body: T } | never> {
  if (!isShopifyConfigured) {
    throw new Error(
      'Shopify is not configured. Please add SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN environment variables.'
    );
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < RATE_LIMIT.MAX_RETRIES; attempt++) {
    try {
      await waitForRateLimit();

      const result = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': storefrontAccessToken || '',
          ...headers,
        },
        body: JSON.stringify({
          ...(query && { query }),
          ...(variables && { variables }),
        }),
        cache: cache ?? 'force-cache',
        ...(revalidate || tags
          ? { next: { ...(revalidate && { revalidate }), ...(tags && { tags }) } }
          : {}),
      });

      if (result.status === 429) {
        const retryAfter = result.headers.get('Retry-After');
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RATE_LIMIT.RETRY_DELAY_MS * (attempt + 1);
        console.warn(`Shopify rate limited. Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      const body = await result.json();

      if (body.errors) {
        const throttleError = body.errors.find(
          (e: { message?: string }) => e.message?.toLowerCase().includes('throttled')
        );
        if (throttleError) {
          await sleep(RATE_LIMIT.RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw body.errors[0];
      }

      return { status: result.status, body };
    } catch (e) {
      lastError = e as Error;
      if (attempt < RATE_LIMIT.MAX_RETRIES - 1) {
        await sleep(RATE_LIMIT.RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  if (!isShopifyConfigured) {
    throw new Error('Shopify not configured');
  }

  throw { error: lastError, query };
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return (array?.edges ?? []).map((edge) => edge.node);
};

const reshapeImages = (images: Connection<Image>, productTitle: string): Image[] => {
  const flattened = removeEdgesAndNodes(images);
  return flattened.map((image) => ({
    ...image,
    altText: image.altText || productTitle,
  }));
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
): Product | undefined => {
  if (!product) return undefined;
  const tags = product.tags || [];
  if (filterHiddenProducts && Array.isArray(tags) && tags.includes('nextjs-frontend-hidden')) {
    return undefined;
  }
  const { images, variants, ...rest } = product;
  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: { ...variants, edges: variants.edges, pageInfo: variants.pageInfo },
  };
};

const reshapeProducts = (products: ShopifyProduct[]): Product[] => {
  const reshapedProducts: Product[] = [];
  for (const product of products) {
    const reshapedProduct = reshapeProduct(product);
    if (reshapedProduct) reshapedProducts.push(reshapedProduct);
  }
  return reshapedProducts;
};

const reshapeCollection = (collection: ShopifyCollection): Collection | undefined => {
  if (!collection) return undefined;
  return { ...collection };
};

const reshapeCollections = (collections: ShopifyCollection[]): Collection[] => {
  const reshapedCollections: Collection[] = [];
  for (const collection of collections) {
    const rc = reshapeCollection(collection);
    if (rc) reshapedCollections.push(rc);
  }
  return reshapedCollections;
};

/* ─── GraphQL Fragments ─── */

const productFragment = /* GraphQL */ `
  fragment product on Product {
    id
    handle
    availableForSale
    title
    description
    descriptionHtml
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 100) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
            altText
            width
            height
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 20) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    seo {
      title
      description
    }
    tags
    updatedAt
    vendor
    productType
  }
`;

const productListFragment = /* GraphQL */ `
  fragment productList on Product {
    id
    handle
    availableForSale
    title
    description
    options {
      id
      name
      values
    }
    priceRange {
      maxVariantPrice {
        amount
        currencyCode
      }
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 10) {
      edges {
        node {
          id
          title
          availableForSale
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    featuredImage {
      url
      altText
      width
      height
    }
    images(first: 1) {
      edges {
        node {
          url
          altText
          width
          height
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    tags
    updatedAt
    vendor
    productType
  }
`;

const collectionFragment = /* GraphQL */ `
  fragment collection on Collection {
    handle
    title
    description
    seo {
      title
      description
    }
    updatedAt
    image {
      url
      altText
      width
      height
    }
  }
`;

/* ─── Queries — all use @inContext(country:) for presentment currency ─── */

const getProductQuery = /* GraphQL */ `
  query getProduct($handle: String!, $country: CountryCode) @inContext(country: $country) {
    product(handle: $handle) {
      ...product
    }
  }
  ${productFragment}
`;

const getProductsQuery = /* GraphQL */ `
  query getProducts($sortKey: ProductSortKeys, $reverse: Boolean, $query: String, $first: Int, $after: String, $country: CountryCode) @inContext(country: $country) {
    products(sortKey: $sortKey, reverse: $reverse, query: $query, first: $first, after: $after) {
      edges {
        node {
          ...product
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${productFragment}
`;

const getCollectionQuery = /* GraphQL */ `
  query getCollection($handle: String!, $country: CountryCode) @inContext(country: $country) {
    collection(handle: $handle) {
      ...collection
    }
  }
  ${collectionFragment}
`;

const getCollectionsQuery = /* GraphQL */ `
  query getCollections($first: Int = 100, $after: String, $country: CountryCode) @inContext(country: $country) {
    collections(first: $first, sortKey: TITLE, after: $after) {
      edges {
        node {
          ...collection
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${collectionFragment}
`;

const getCollectionProductsQuery = /* GraphQL */ `
  query getCollectionProducts($handle: String!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $first: Int, $after: String, $country: CountryCode) @inContext(country: $country) {
    collection(handle: $handle) {
      products(sortKey: $sortKey, reverse: $reverse, first: $first, after: $after) {
        edges {
          node {
            ...product
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${productFragment}
`;

const getProductsListQuery = /* GraphQL */ `
  query getProductsList($sortKey: ProductSortKeys, $reverse: Boolean, $query: String, $first: Int, $after: String, $country: CountryCode) @inContext(country: $country) {
    products(sortKey: $sortKey, reverse: $reverse, query: $query, first: $first, after: $after) {
      edges {
        node {
          ...productList
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${productListFragment}
`;

const getCollectionProductsListQuery = /* GraphQL */ `
  query getCollectionProductsList($handle: String!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $first: Int, $after: String, $country: CountryCode) @inContext(country: $country) {
    collection(handle: $handle) {
      products(sortKey: $sortKey, reverse: $reverse, first: $first, after: $after) {
        edges {
          node {
            ...productList
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${productListFragment}
`;

/* ─── API Functions ─── */

export async function getProduct(handle: string): Promise<Product | undefined> {
  const res = await shopifyFetch<{
    data: { product: ShopifyProduct };
    variables: { handle: string; country: string };
  }>({
    query: getProductQuery,
    tags: [TAGS.products],
    variables: { handle, country: DEFAULT_COUNTRY },
    revalidate: CACHE_TIMES.products,
  });

  return reshapeProduct(res.body.data.product, false);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
  first = 100,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  first?: number;
} = {}): Promise<Product[]> {
  const safeFirst = Math.min(first, 250);
  const res = await shopifyFetch<{
    data: { products: Connection<ShopifyProduct> };
    variables: {
      query?: string;
      reverse?: boolean;
      sortKey?: string;
      first?: number;
      country: string;
    };
  }>({
    query: getProductsListQuery,
    tags: [TAGS.products],
    variables: { query, reverse, sortKey, first: safeFirst, country: DEFAULT_COUNTRY },
    revalidate: CACHE_TIMES.products,
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

export async function getAllProducts({
  query,
  reverse,
  sortKey,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
} = {}): Promise<Product[]> {
  const allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  // Shopify Storefront API allows up to 250 per page
  const pageSize = 250;

  while (hasNextPage) {
    const res = await shopifyFetch<{
      data: { products: Connection<ShopifyProduct> };
      variables: {
        query?: string;
        reverse?: boolean;
        sortKey?: string;
        first: number;
        after?: string;
        country: string;
      };
    }>({
      query: getProductsListQuery,
      tags: [TAGS.products],
      revalidate: CACHE_TIMES.products,
      variables: {
        query,
        reverse,
        sortKey,
        first: pageSize,
        country: DEFAULT_COUNTRY,
        ...(cursor && { after: cursor }),
      },
    });

    const products = res.body.data.products;
    allProducts.push(...removeEdgesAndNodes(products));
    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return reshapeProducts(allProducts);
}

export async function getCollection(handle: string): Promise<Collection | undefined> {
  const res = await shopifyFetch<{
    data: { collection: ShopifyCollection };
    variables: { handle: string; country: string };
  }>({
    query: getCollectionQuery,
    tags: [TAGS.collections],
    variables: { handle, country: DEFAULT_COUNTRY },
    revalidate: CACHE_TIMES.collections,
  });

  return reshapeCollection(res.body.data.collection);
}

export async function getCollections(): Promise<Collection[]> {
  let allCollections: ShopifyCollection[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    const res = await shopifyFetch<{
      data: { collections: Connection<ShopifyCollection> };
      variables: { first: number; after: string | null; country: string };
    }>({
      query: getCollectionsQuery,
      tags: [TAGS.collections],
      variables: { first: 100, after: cursor, country: DEFAULT_COUNTRY },
      revalidate: CACHE_TIMES.collections,
    });

    const collections = res.body.data.collections;
    allCollections = allCollections.concat(removeEdgesAndNodes(collections));
    hasNextPage = collections.pageInfo.hasNextPage;
    cursor = collections.pageInfo.endCursor;
  }

  return reshapeCollections(allCollections);
}

export async function getCollectionProducts({
  handle,
  reverse,
  sortKey,
  first = 250,
}: {
  handle: string;
  reverse?: boolean;
  sortKey?: string;
  first?: number;
}): Promise<Product[]> {
  const safeFirst = Math.min(first, 250);
  const res = await shopifyFetch<{
    data: { collection: { products: Connection<ShopifyProduct> } };
    variables: {
      handle: string;
      reverse?: boolean;
      sortKey?: string;
      first?: number;
      country: string;
    };
  }>({
    query: getCollectionProductsListQuery,
    tags: [TAGS.collections, TAGS.products],
    variables: { handle, reverse, sortKey, first: safeFirst, country: DEFAULT_COUNTRY },
    revalidate: CACHE_TIMES.products,
  });

  if (!res.body.data.collection) {
    console.log(`No collection found for handle: ${handle}`);
    return [];
  }

  return reshapeProducts(removeEdgesAndNodes(res.body.data.collection.products));
}

export async function getAllCollectionProducts({
  handle,
  reverse,
  sortKey,
}: {
  handle: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  const allProducts: ShopifyProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  // Shopify Storefront API allows up to 250 per page
  const pageSize = 250;

  while (hasNextPage) {
    const res = await shopifyFetch<{
      data: { collection: { products: Connection<ShopifyProduct> } | null };
      variables: {
        handle: string;
        reverse?: boolean;
        sortKey?: string;
        first: number;
        after?: string;
        country: string;
      };
    }>({
      query: getCollectionProductsListQuery,
      tags: [TAGS.collections, TAGS.products],
      revalidate: CACHE_TIMES.products,
      variables: {
        handle,
        reverse,
        sortKey,
        first: pageSize,
        country: DEFAULT_COUNTRY,
        ...(cursor && { after: cursor }),
      },
    });

    if (!res.body.data.collection) return [];
    const products = res.body.data.collection.products;
    allProducts.push(...removeEdgesAndNodes(products));
    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return reshapeProducts(allProducts);
}

/* ─── Blog Operations ─── */

const articleFragment = /* GraphQL */ `
  fragment article on Article {
    id
    handle
    title
    content
    contentHtml
    excerpt
    excerptHtml
    publishedAt
    author {
      name
      bio
    }
    image {
      url
      altText
      width
      height
    }
    tags
    seo {
      title
      description
    }
    blog {
      handle
      title
    }
  }
`;

const getArticlesQuery = /* GraphQL */ `
  query getArticles($first: Int, $query: String, $sortKey: ArticleSortKeys, $reverse: Boolean, $after: String) {
    articles(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse, after: $after) {
      edges {
        node {
          ...article
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
  ${articleFragment}
`;

const getArticleQuery = /* GraphQL */ `
  query getArticle($blogHandle: String!, $articleHandle: String!) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        ...article
      }
    }
  }
  ${articleFragment}
`;

const getBlogsQuery = /* GraphQL */ `
  query getBlogs($first: Int) {
    blogs(first: $first) {
      edges {
        node {
          id
          handle
          title
          seo {
            title
            description
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
`;

const getBlogQuery = /* GraphQL */ `
  query getBlog($handle: String!, $first: Int, $after: String) {
    blog(handle: $handle) {
      id
      handle
      title
      seo {
        title
        description
      }
      articles(first: $first, after: $after, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            ...article
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
  ${articleFragment}
`;

function reshapeArticle(article: ShopifyBlogArticle): BlogArticle {
  return { ...article, author: article.author || { name: 'Unknown' } };
}

function reshapeArticles(articles: ShopifyBlogArticle[]): BlogArticle[] {
  return articles.map(reshapeArticle);
}

export async function getArticles({
  first = 20,
  query,
  sortKey = 'PUBLISHED_AT',
  reverse = true,
}: {
  first?: number;
  query?: string;
  sortKey?: string;
  reverse?: boolean;
} = {}): Promise<BlogArticle[]> {
  const res = await shopifyFetch<{
    data: { articles: Connection<ShopifyBlogArticle> };
    variables: { first?: number; query?: string; sortKey?: string; reverse?: boolean };
  }>({
    query: getArticlesQuery,
    tags: [TAGS.collections],
    variables: { first: Math.min(first, 50), query, sortKey, reverse },
    revalidate: CACHE_TIMES.products,
  });

  return reshapeArticles(removeEdgesAndNodes(res.body.data.articles));
}

export async function getAllArticles({
  query,
  sortKey = 'PUBLISHED_AT',
  reverse = true,
}: {
  query?: string;
  sortKey?: string;
  reverse?: boolean;
} = {}): Promise<BlogArticle[]> {
  const allArticles: ShopifyBlogArticle[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const pageSize = 50;

  while (hasNextPage) {
    const res = await shopifyFetch<{
      data: { articles: Connection<ShopifyBlogArticle> };
      variables: {
        first: number;
        query?: string;
        sortKey?: string;
        reverse?: boolean;
        after?: string;
      };
    }>({
      query: getArticlesQuery,
      tags: [TAGS.collections],
      variables: {
        first: pageSize,
        query,
        sortKey,
        reverse,
        ...(cursor && { after: cursor }),
      },
      revalidate: CACHE_TIMES.products,
    });

    const articles = res.body.data.articles;
    allArticles.push(...removeEdgesAndNodes(articles));
    hasNextPage = articles.pageInfo.hasNextPage;
    cursor = articles.pageInfo.endCursor;
  }

  return reshapeArticles(allArticles);
}

export async function getArticle(
  blogHandle: string,
  articleHandle: string
): Promise<BlogArticle | null> {
  const res = await shopifyFetch<{
    data: { blog: { articleByHandle: ShopifyBlogArticle | null } | null };
    variables: { blogHandle: string; articleHandle: string };
  }>({
    query: getArticleQuery,
    tags: [TAGS.collections],
    variables: { blogHandle, articleHandle },
    revalidate: CACHE_TIMES.products,
  });

  if (!res.body.data.blog?.articleByHandle) return null;
  return reshapeArticle(res.body.data.blog.articleByHandle);
}

export async function getBlogs(first = 10): Promise<Blog[]> {
  const res = await shopifyFetch<{
    data: { blogs: Connection<ShopifyBlog> };
    variables: { first: number };
  }>({
    query: getBlogsQuery,
    tags: [TAGS.collections],
    variables: { first },
    revalidate: CACHE_TIMES.products,
  });

  return removeEdgesAndNodes(res.body.data.blogs);
}

export async function getBlog(handle: string, articleCount = 20): Promise<Blog | null> {
  const res = await shopifyFetch<{
    data: { blog: ShopifyBlog | null };
    variables: { handle: string; first: number };
  }>({
    query: getBlogQuery,
    tags: [TAGS.collections],
    variables: { handle, first: articleCount },
    revalidate: CACHE_TIMES.products,
  });

  return res.body.data.blog;
}

export async function getAllBlogArticles(handle: string): Promise<BlogArticle[]> {
  const allArticles: ShopifyBlogArticle[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;
  const pageSize = 50;

  while (hasNextPage) {
    const res = await shopifyFetch<{
      data: { blog: { articles: Connection<ShopifyBlogArticle> } | null };
      variables: { handle: string; first: number; after?: string };
    }>({
      query: getBlogQuery,
      tags: [TAGS.collections],
      variables: { handle, first: pageSize, ...(cursor && { after: cursor }) },
      revalidate: CACHE_TIMES.products,
    });

    if (!res.body.data.blog) return [];
    const articles = res.body.data.blog.articles;
    allArticles.push(...removeEdgesAndNodes(articles));
    hasNextPage = articles.pageInfo.hasNextPage;
    cursor = articles.pageInfo.endCursor;
  }

  return reshapeArticles(allArticles);
}

/* ─── Cart Operations ─── */

const cartFragment = /* GraphQL */ `
  fragment cart on Cart {
    id
    checkoutUrl
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              selectedOptions {
                name
                value
              }
              product {
                id
                handle
                title
                featuredImage {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
    totalQuantity
  }
`;

const createCartMutation = /* GraphQL */ `
  mutation createCart($lineItems: [CartLineInput!]) {
    cartCreate(input: { lines: $lineItems }) {
      cart {
        ...cart
      }
    }
  }
  ${cartFragment}
`;

const addToCartMutation = /* GraphQL */ `
  mutation addToCart($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...cart
      }
    }
  }
  ${cartFragment}
`;

const removeFromCartMutation = /* GraphQL */ `
  mutation removeFromCart($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...cart
      }
    }
  }
  ${cartFragment}
`;

const updateCartMutation = /* GraphQL */ `
  mutation updateCart($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...cart
      }
    }
  }
  ${cartFragment}
`;

const getCartQuery = /* GraphQL */ `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...cart
    }
  }
  ${cartFragment}
`;

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: 'EUR',
    };
  }
  return { ...cart, lines: cart.lines };
};

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<{ data: { cartCreate: { cart: ShopifyCart } } }>({
    query: createCartMutation,
    cache: 'no-store',
  });
  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<{
    data: { cartLinesAdd: { cart: ShopifyCart } };
    variables: { cartId: string; lines: { merchandiseId: string; quantity: number }[] };
  }>({
    query: addToCartMutation,
    variables: { cartId, lines },
    cache: 'no-store',
  });
  return reshapeCart(res.body.data.cartLinesAdd.cart);
}

export async function removeFromCart(cartId: string, lineIds: string[]): Promise<Cart> {
  const res = await shopifyFetch<{
    data: { cartLinesRemove: { cart: ShopifyCart } };
    variables: { cartId: string; lineIds: string[] };
  }>({
    query: removeFromCartMutation,
    variables: { cartId, lineIds },
    cache: 'no-store',
  });
  return reshapeCart(res.body.data.cartLinesRemove.cart);
}

export async function updateCart(
  cartId: string,
  lines: { id: string; merchandiseId?: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<{
    data: { cartLinesUpdate: { cart: ShopifyCart } };
    variables: {
      cartId: string;
      lines: { id: string; merchandiseId: string; quantity: number }[];
    };
  }>({
    query: updateCartMutation,
    variables: { cartId, lines },
    cache: 'no-store',
  });
  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
  const res = await shopifyFetch<{
    data: { cart: ShopifyCart };
    variables: { cartId: string };
  }>({
    query: getCartQuery,
    variables: { cartId },
    tags: [TAGS.cart],
    cache: 'no-store',
  });
  if (!res.body.data.cart) return undefined;
  return reshapeCart(res.body.data.cart);
}

export * from './image';
