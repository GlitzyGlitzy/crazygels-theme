/**
 * Client-side Klaviyo tracking helpers.
 * These use the Klaviyo JavaScript Push API (window.klaviyo / window._learnq).
 */

declare global {
  interface Window {
    klaviyo?: {
      push: (args: unknown[]) => void;
      identify: (profile: Record<string, unknown>) => void;
      track: (event: string, properties?: Record<string, unknown>) => void;
      trackViewedItem: (item: Record<string, unknown>) => void;
    };
    _learnq?: unknown[][];
  }
}

function getKlaviyo() {
  if (typeof window === 'undefined') return null;
  // _learnq is the push queue that Klaviyo uses before their script loads
  window._learnq = window._learnq || [];
  return window._learnq;
}

/* ------------------------------------------------------------------ */
/*  Identify a known user (email subscriber / logged-in customer)     */
/* ------------------------------------------------------------------ */
export function klaviyoIdentify(profile: {
  email: string;
  firstName?: string;
  lastName?: string;
}) {
  const kl = getKlaviyo();
  if (!kl) return;

  kl.push([
    'identify',
    {
      $email: profile.email,
      ...(profile.firstName && { $first_name: profile.firstName }),
      ...(profile.lastName && { $last_name: profile.lastName }),
    },
  ]);
}

/* ------------------------------------------------------------------ */
/*  Track: Viewed Product                                              */
/* ------------------------------------------------------------------ */
export interface KlaviyoProductData {
  productName: string;
  productId: string;
  sku?: string;
  imageUrl?: string;
  url: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  categories?: string[];
}

export function trackViewedProduct(product: KlaviyoProductData) {
  const kl = getKlaviyo();
  if (!kl) return;

  kl.push([
    'track',
    'Viewed Product',
    {
      ProductName: product.productName,
      ProductID: product.productId,
      SKU: product.sku,
      ImageURL: product.imageUrl,
      URL: product.url,
      Brand: product.brand,
      Price: product.price,
      CompareAtPrice: product.compareAtPrice,
      Categories: product.categories,
    },
  ]);

  // Also push to the "recently viewed" item tracking
  kl.push([
    'trackViewedItem',
    {
      Title: product.productName,
      ItemId: product.productId,
      ImageUrl: product.imageUrl,
      Url: product.url,
      Metadata: {
        Brand: product.brand,
        Price: product.price,
        CompareAtPrice: product.compareAtPrice,
      },
    },
  ]);
}

/* ------------------------------------------------------------------ */
/*  Track: Added to Cart                                               */
/* ------------------------------------------------------------------ */
export interface KlaviyoCartItem {
  productName: string;
  productId: string;
  sku?: string;
  imageUrl?: string;
  url: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  quantity: number;
  variantName?: string;
}

export function trackAddedToCart(item: KlaviyoCartItem) {
  const kl = getKlaviyo();
  if (!kl) return;

  kl.push([
    'track',
    'Added to Cart',
    {
      $value: item.price * item.quantity,
      AddedItemProductName: item.productName,
      AddedItemProductID: item.productId,
      AddedItemSKU: item.sku,
      AddedItemImageURL: item.imageUrl,
      AddedItemURL: item.url,
      AddedItemPrice: item.price,
      AddedItemQuantity: item.quantity,
      AddedItemVariantName: item.variantName,
      ItemNames: [item.productName],
    },
  ]);
}
