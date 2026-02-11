import sql from "@/lib/db";

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN?.replace(
  /^https?:\/\//,
  ""
).replace(/\/$/, "");
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

const ADMIN_API_VERSION = "2024-01";

interface CatalogProduct {
  product_hash: string;
  display_name: string;
  category: string;
  product_type: string;
  price_tier: string;
  efficacy_score: number;
  key_actives: string[];
  suitable_for: string[];
  contraindications: string[];
  image_url: string | null;
  description_generated: string | null;
}

interface SourceIntelligence {
  acquisition_lead: string;
  wholesale_price: number | null;
  moq: number | null;
  lead_time_days: number | null;
}

const MARGIN_MAP: Record<string, number> = {
  budget: 2.8,
  mid: 2.5,
  premium: 2.2,
  luxury: 2.0,
};

function calculateRetailPrice(
  wholesalePrice: number | null,
  priceTier: string
): string {
  if (!wholesalePrice) {
    const defaults: Record<string, string> = {
      budget: "14.99",
      mid: "24.99",
      premium: "39.99",
      luxury: "59.99",
    };
    return defaults[priceTier] || "29.99";
  }
  const multiplier = MARGIN_MAP[priceTier] || 2.5;
  const retail = wholesalePrice * multiplier;
  return (Math.ceil(retail) - 0.01).toFixed(2);
}

function generateDescription(product: CatalogProduct): string {
  const activesHtml =
    product.key_actives.length > 0
      ? `<h3>Key Actives</h3><ul>${product.key_actives
          .map((a) => `<li>${a.charAt(0).toUpperCase() + a.slice(1)}</li>`)
          .join("")}</ul>`
      : "";

  const suitableHtml =
    product.suitable_for.length > 0
      ? `<p><strong>Best for:</strong> ${product.suitable_for.join(", ")} skin</p>`
      : "";

  const contraHtml =
    product.contraindications.length > 0
      ? `<p><em>May not be suitable for: ${product.contraindications.join(", ")} skin</em></p>`
      : "";

  return `
    <div class="cg-product-intel">
      <h2>Bio-Optimised by Crazy Gels Intelligence</h2>
      <p>Our system analysed thousands of skin profiles and reviews,
      scoring this formula <strong>${(product.efficacy_score * 100).toFixed(0)}% efficacy</strong>
      across verified sources.</p>
      ${activesHtml}
      ${suitableHtml}
      ${contraHtml}
      <p><em>Selected by algorithm. Validated by community. Delivered by Crazy Gels.</em></p>
    </div>
  `.trim();
}

async function shopifyAdminFetch<T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  if (!SHOPIFY_STORE || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error(
      "Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN."
    );
  }

  const url = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Shopify Admin API error (${res.status}): ${errorText}`
    );
  }

  return res.json() as Promise<T>;
}

export async function getProductFromCatalog(
  productHash: string
): Promise<CatalogProduct> {
  const result = await sql<CatalogProduct[]>`
    SELECT product_hash, display_name, category, product_type, price_tier,
           efficacy_score, key_actives, suitable_for, contraindications,
           image_url, description_generated
    FROM product_catalog WHERE product_hash = ${productHash}`;

  if (result.length === 0) {
    throw new Error(`Product not found in catalog: ${productHash}`);
  }

  return result[0];
}

export async function getSourceIntelligence(
  productHash: string
): Promise<SourceIntelligence | null> {
  const result = await sql<SourceIntelligence[]>`
    SELECT acquisition_lead, wholesale_price, moq, lead_time_days
    FROM source_intelligence WHERE product_hash = ${productHash}
    ORDER BY created_at DESC LIMIT 1`;

  return result.length > 0 ? result[0] : null;
}

export async function listProduct(productHash: string) {
  const product = await getProductFromCatalog(productHash);
  const source = await getSourceIntelligence(productHash);

  const retailPrice = calculateRetailPrice(
    source?.wholesale_price ?? null,
    product.price_tier
  );

  const shopifyResponse = await shopifyAdminFetch<{
    product: { id: number; handle: string; variants: Array<{ id: number }> };
  }>("/products.json", "POST", {
    product: {
      title: product.display_name,
      body_html:
        product.description_generated || generateDescription(product),
      vendor: "Crazy Gels Select",
      product_type: product.category,
      tags: [
        "bio-optimised",
        "ai-curated",
        ...product.key_actives,
        product.price_tier,
        ...product.suitable_for.map((s) => `skin-${s}`),
      ].join(", "),
      status: "draft",
      variants: [
        {
          price: retailPrice,
          inventory_quantity: 0,
          inventory_management: "shopify",
          fulfillment_service: "manual",
          requires_shipping: true,
        },
      ],
      ...(product.image_url
        ? { images: [{ src: product.image_url }] }
        : {}),
      metafields: [
        {
          namespace: "crazygels",
          key: "efficacy_score",
          value: String(product.efficacy_score),
          type: "number_decimal",
        },
        {
          namespace: "crazygels",
          key: "key_actives",
          value: JSON.stringify(product.key_actives),
          type: "json",
        },
        {
          namespace: "crazygels",
          key: "product_hash",
          value: product.product_hash,
          type: "single_line_text_field",
        },
        {
          namespace: "crazygels",
          key: "suitable_for",
          value: JSON.stringify(product.suitable_for),
          type: "json",
        },
      ],
    },
  });

  const shopifyId = String(shopifyResponse.product.id);

  await sql`
    UPDATE source_intelligence
    SET listed_on_shopify = TRUE,
        shopify_product_id = ${shopifyId},
        updated_at = NOW()
    WHERE product_hash = ${productHash}`;

  await sql`
    UPDATE product_catalog
    SET status = 'listed',
        updated_at = NOW()
    WHERE product_hash = ${productHash}`;

  return {
    shopify_product_id: shopifyId,
    handle: shopifyResponse.product.handle,
    price: retailPrice,
    status: "draft",
  };
}

export async function updateInventory(
  shopifyProductId: string,
  quantity: number
) {
  const product = await shopifyAdminFetch<{
    product: {
      variants: Array<{ id: number; inventory_item_id: number }>;
    };
  }>(`/products/${shopifyProductId}.json?fields=variants`);

  const inventoryItemId = product.product.variants[0]?.inventory_item_id;
  if (!inventoryItemId) throw new Error("No variant found");

  const locations = await shopifyAdminFetch<{
    locations: Array<{ id: number; active: boolean }>;
  }>("/locations.json");

  const activeLocation = locations.locations.find((l) => l.active);
  if (!activeLocation) throw new Error("No active location found");

  await shopifyAdminFetch(
    "/inventory_levels/set.json",
    "POST",
    {
      location_id: activeLocation.id,
      inventory_item_id: inventoryItemId,
      available: quantity,
    }
  );

  if (quantity > 0) {
    await shopifyAdminFetch(`/products/${shopifyProductId}.json`, "PUT", {
      product: { id: Number(shopifyProductId), status: "active" },
    });
  }

  return { inventory_item_id: inventoryItemId, quantity, location_id: activeLocation.id };
}
