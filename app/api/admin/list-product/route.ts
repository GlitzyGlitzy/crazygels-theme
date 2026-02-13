import { NextRequest, NextResponse } from "next/server";
import { listProduct, updateInventory } from "@/lib/shopify/list-product";

export async function POST(request: NextRequest) {
  // Verify admin token
  const adminToken = request.headers.get("x-admin-token");
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { product_hash, action, quantity } = body;

    if (!product_hash) {
      return NextResponse.json(
        { error: "product_hash is required" },
        { status: 400 }
      );
    }

    if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN) {
      return NextResponse.json(
        { error: "Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN environment variables." },
        { status: 503 }
      );
    }

    if (action === "update_inventory") {
      // Update inventory for an already-listed product
      const { shopify_product_id } = body;
      if (!shopify_product_id || quantity === undefined) {
        return NextResponse.json(
          { error: "shopify_product_id and quantity required for inventory update" },
          { status: 400 }
        );
      }

      const result = await updateInventory(shopify_product_id, quantity);
      return NextResponse.json({
        success: true,
        action: "inventory_updated",
        ...result,
      });
    }

    // Default action: list product on Shopify
    const result = await listProduct(product_hash);

    return NextResponse.json({
      success: true,
      action: "listed",
      ...result,
    });
  } catch (error) {
    console.error("List product error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to list product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
