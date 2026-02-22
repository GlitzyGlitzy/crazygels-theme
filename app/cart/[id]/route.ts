import { NextRequest, NextResponse } from 'next/server';
import { shopifyFetch } from '@/lib/shopify';

/**
 * Google Merchant Center "Buy on Google" / Direct Purchase route.
 *
 * URL pattern: https://crazygels.com/cart/{id}
 *
 * The {id} is the g:id from the merchant feed, which has the format:
 *   - shopify_PRODUCTID_VARIANTID  (multi-variant products)
 *   - shopify_PRODUCTID            (single-variant products)
 *
 * This route creates a Shopify cart with that variant and redirects
 * the customer to Shopify's hosted checkout page.
 *
 * For Google Merchant Center checkout settings, set the URL to:
 *   https://crazygels.com/cart/{id}
 */

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://crazygels.com';

// Minimal cart create mutation that returns the checkout URL
const createCartWithItemMutation = /* GraphQL */ `
  mutation createCartWithItem($lines: [CartLineInput!]!) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Query to get the first variant of a product by its numeric ID
const getProductVariantsQuery = /* GraphQL */ `
  query getProductVariants($id: ID!) {
    product(id: $id) {
      variants(first: 1) {
        edges {
          node {
            id
          }
        }
      }
    }
  }
`;

async function resolveVariantGid(feedId: string): Promise<string | null> {
  // Feed IDs look like:
  //   shopify_PRODUCTID_VARIANTID  -> extract variant ID
  //   shopify_PRODUCTID            -> look up first variant via API

  const parts = feedId.replace(/^shopify_/, '').split('_');

  if (parts.length >= 2 && parts[1]) {
    // We have a variant ID -- build the GID
    return `gid://shopify/ProductVariant/${parts[1]}`;
  }

  if (parts.length >= 1 && parts[0]) {
    // Only product ID -- fetch the first variant
    const productGid = `gid://shopify/Product/${parts[0]}`;
    try {
      const res = await shopifyFetch<{
        data: { product: { variants: { edges: { node: { id: string } }[] } } | null };
        variables: { id: string };
      }>({
        query: getProductVariantsQuery,
        variables: { id: productGid },
        cache: 'no-store',
      });

      const firstVariant = res.body.data.product?.variants?.edges?.[0]?.node;
      return firstVariant?.id || null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: feedId } = await params;

  if (!feedId) {
    return NextResponse.redirect(`${BASE_URL}/cart`);
  }

  try {
    const variantGid = await resolveVariantGid(feedId);

    if (!variantGid) {
      // Can't resolve the variant -- redirect to homepage
      console.error(`[cart/{id}] Could not resolve variant for feed ID: ${feedId}`);
      return NextResponse.redirect(`${BASE_URL}/cart`);
    }

    // Create a cart with this variant (quantity 1) and get checkout URL
    const res = await shopifyFetch<{
      data: {
        cartCreate: {
          cart: { id: string; checkoutUrl: string } | null;
          userErrors: { field: string[]; message: string }[];
        };
      };
      variables: { lines: { merchandiseId: string; quantity: number }[] };
    }>({
      query: createCartWithItemMutation,
      variables: {
        lines: [{ merchandiseId: variantGid, quantity: 1 }],
      },
      cache: 'no-store',
    });

    const { cart, userErrors } = res.body.data.cartCreate;

    if (userErrors?.length > 0) {
      console.error(`[cart/{id}] Shopify user errors:`, userErrors);
      return NextResponse.redirect(`${BASE_URL}/cart`);
    }

    if (cart?.checkoutUrl) {
      return NextResponse.redirect(cart.checkoutUrl);
    }

    // Fallback: redirect to cart page
    return NextResponse.redirect(`${BASE_URL}/cart`);
  } catch (error) {
    console.error(`[cart/{id}] Error creating checkout for ${feedId}:`, error);
    return NextResponse.redirect(`${BASE_URL}/cart`);
  }
}
