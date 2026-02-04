import { SHOPIFY_GRAPHQL_API_ENDPOINT, TAGS } from './constants';
import {
  Cart,
  Collection,
  Connection,
  Image,
  Product,
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct,
} from './types';

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontAccessToken = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;

const endpoint = `https://${domain}${SHOPIFY_GRAPHQL_API_ENDPOINT}`;

type ExtractVariables<T> = T extends { variables: object } ? T['variables'] : never;

export async function shopifyFetch<T>({
  cache = 'force-cache',
  headers,
  query,
  tags,
  variables,
}: {
  cache?: RequestCache;
  headers?: HeadersInit;
  query: string;
  tags?: string[];
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  try {
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
      cache,
      ...(tags && { next: { tags } }),
    });

    const body = await result.json();

    if (body.errors) {
      throw body.errors[0];
    }

    return {
      status: result.status,
      body,
    };
  } catch (e) {
    console.error('Shopify Fetch Error:', e);
    throw {
      error: e,
      query,
    };
  }
}

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge.node);
};

const reshapeImages = (images: Connection<Image>, productTitle: string): Image[] => {
  const flattened = removeEdgesAndNodes(images);
  return flattened.map((image) => ({
    ...image,
    altText: image.altText || productTitle,
  }));
};

const reshapeProduct = (product: ShopifyProduct, filterHiddenProducts: boolean = true): Product | undefined => {
  if (!product || (filterHiddenProducts && product.tags.includes('nextjs-frontend-hidden'))) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  return {
    ...rest,
    images: reshapeImages(images, product.title),
    variants: {
      ...variants,
      edges: variants.edges,
      pageInfo: variants.pageInfo,
    },
  };
};

const reshapeProducts = (products: ShopifyProduct[]): Product[] => {
  const reshapedProducts = [];
  for (const product of products) {
    const reshapedProduct = reshapeProduct(product);
    if (reshapedProduct) {
      reshapedProducts.push(reshapedProduct);
    }
  }
  return reshapedProducts;
};

const reshapeCollection = (collection: ShopifyCollection): Collection | undefined => {
  if (!collection) return undefined;
  return {
    ...collection,
  };
};

const reshapeCollections = (collections: ShopifyCollection[]): Collection[] => {
  const reshapedCollections = [];
  for (const collection of collections) {
    const reshapedCollection = reshapeCollection(collection);
    if (reshapedCollection) {
      reshapedCollections.push(reshapedCollection);
    }
  }
  return reshapedCollections;
};

// GraphQL Fragments
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
    variants(first: 250) {
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

// Queries
const getProductQuery = /* GraphQL */ `
  query getProduct($handle: String!) {
    product(handle: $handle) {
      ...product
    }
  }
  ${productFragment}
`;

const getProductsQuery = /* GraphQL */ `
  query getProducts($sortKey: ProductSortKeys, $reverse: Boolean, $query: String, $first: Int) {
    products(sortKey: $sortKey, reverse: $reverse, query: $query, first: $first) {
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
  query getCollection($handle: String!) {
    collection(handle: $handle) {
      ...collection
    }
  }
  ${collectionFragment}
`;

const getCollectionsQuery = /* GraphQL */ `
  query getCollections {
    collections(first: 100, sortKey: TITLE) {
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
  query getCollectionProducts($handle: String!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean, $first: Int) {
    collection(handle: $handle) {
      products(sortKey: $sortKey, reverse: $reverse, first: $first) {
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

// API Functions
export async function getProduct(handle: string): Promise<Product | undefined> {
  const res = await shopifyFetch<{ data: { product: ShopifyProduct }; variables: { handle: string } }>({
    query: getProductQuery,
    tags: [TAGS.products],
    variables: { handle },
  });

  return reshapeProduct(res.body.data.product, false);
}

export async function getProducts({
  query,
  reverse,
  sortKey,
  first = 20,
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
  first?: number;
} = {}): Promise<Product[]> {
  const res = await shopifyFetch<{
    data: { products: Connection<ShopifyProduct> };
    variables: { query?: string; reverse?: boolean; sortKey?: string; first?: number };
  }>({
    query: getProductsQuery,
    tags: [TAGS.products],
    variables: { query, reverse, sortKey, first },
  });

  return reshapeProducts(removeEdgesAndNodes(res.body.data.products));
}

export async function getCollection(handle: string): Promise<Collection | undefined> {
  const res = await shopifyFetch<{ data: { collection: ShopifyCollection }; variables: { handle: string } }>({
    query: getCollectionQuery,
    tags: [TAGS.collections],
    variables: { handle },
  });

  return reshapeCollection(res.body.data.collection);
}

export async function getCollections(): Promise<Collection[]> {
  const res = await shopifyFetch<{ data: { collections: Connection<ShopifyCollection> } }>({
    query: getCollectionsQuery,
    tags: [TAGS.collections],
  });

  return reshapeCollections(removeEdgesAndNodes(res.body.data.collections));
}

export async function getCollectionProducts({
  handle,
  reverse,
  sortKey,
  first = 20,
}: {
  handle: string;
  reverse?: boolean;
  sortKey?: string;
  first?: number;
}): Promise<Product[]> {
  const res = await shopifyFetch<{
    data: { collection: { products: Connection<ShopifyProduct> } };
    variables: { handle: string; reverse?: boolean; sortKey?: string; first?: number };
  }>({
    query: getCollectionProductsQuery,
    tags: [TAGS.collections, TAGS.products],
    variables: { handle, reverse, sortKey, first },
  });

  if (!res.body.data.collection) {
    console.log(`No collection found for handle: ${handle}`);
    return [];
  }

  return reshapeProducts(removeEdgesAndNodes(res.body.data.collection.products));
}

// Cart Operations
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
      currencyCode: 'USD',
    };
  }

  return {
    ...cart,
    lines: cart.lines,
  };
};

export async function createCart(): Promise<Cart> {
  const res = await shopifyFetch<{ data: { cartCreate: { cart: ShopifyCart } } }>({
    query: createCartMutation,
    cache: 'no-store',
  });

  return reshapeCart(res.body.data.cartCreate.cart);
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]): Promise<Cart> {
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
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const res = await shopifyFetch<{
    data: { cartLinesUpdate: { cart: ShopifyCart } };
    variables: { cartId: string; lines: { id: string; merchandiseId: string; quantity: number }[] };
  }>({
    query: updateCartMutation,
    variables: { cartId, lines },
    cache: 'no-store',
  });

  return reshapeCart(res.body.data.cartLinesUpdate.cart);
}

export async function getCart(cartId: string): Promise<Cart | undefined> {
  const res = await shopifyFetch<{ data: { cart: ShopifyCart }; variables: { cartId: string } }>({
    query: getCartQuery,
    variables: { cartId },
    tags: [TAGS.cart],
    cache: 'no-store',
  });

  if (!res.body.data.cart) {
    return undefined;
  }

  return reshapeCart(res.body.data.cart);
}
