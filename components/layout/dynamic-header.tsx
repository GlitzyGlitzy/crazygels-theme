import { getCollections, isShopifyConfigured } from "@/lib/shopify"
import { HeaderClient, MenuItem } from "./header-client"

// Default fallback menu when Shopify is not connected
const defaultMenuItems: MenuItem[] = [
  { label: "Gel Nail Wraps", href: "/collections/gel-nail-wraps" },
  { label: "French Styles", href: "/collections/french-styles" },
  { label: "Haircare", href: "/collections/haircare" },
  { label: "Skincare", href: "/collections/skincare" },
  { label: "Treatments", href: "/collections/treatments" },
  { label: "Blog", href: "/blog" },
]

// Handles to exclude from nav (generic/meta collections)
const EXCLUDED_HANDLES = ['all', 'frontpage', 'all-products']

export async function DynamicHeader() {
  if (!isShopifyConfigured) {
    return <HeaderClient menuItems={defaultMenuItems} />
  }

  let menuItems: MenuItem[] = defaultMenuItems

  try {
    const collections = await getCollections()

    // Build menu items directly from real Shopify collections
    const dynamicItems: MenuItem[] = collections
      .filter(c => !EXCLUDED_HANDLES.includes(c.handle.toLowerCase()))
      .map(c => ({
        label: c.title,
        href: `/collections/${c.handle}`,
      }))

    // Add static pages after collections
    dynamicItems.push({ label: "Blog", href: "/blog" })

    if (dynamicItems.length > 0) {
      menuItems = dynamicItems
    }
  } catch {
    // Fall back to default menu items on error
  }

  return <HeaderClient menuItems={menuItems} />
}
