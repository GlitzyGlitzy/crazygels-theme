import { getCollections, isShopifyConfigured } from "@/lib/shopify"
import { HeaderClient, MenuItem } from "./header-client"

// Map collection handles to navigation groupings
const MAIN_CATEGORIES = ['nails', 'nail', 'hair', 'skin', 'skincare'] as const
const CATEGORY_LABELS: Record<string, string> = {
  nail: 'Nails',
  nails: 'Nails',
  hair: 'Hair',
  skin: 'Skin',
  skincare: 'Skin',
}

// Preferred display order for main categories
const CATEGORY_ORDER = ['nails', 'nail', 'hair', 'skin', 'skincare']

// Handles to always exclude from nav
const EXCLUDED_HANDLES = ['all', 'frontpage', 'all-products']

function isMainCategory(handle: string): string | null {
  const lower = handle.toLowerCase()
  for (const cat of MAIN_CATEGORIES) {
    if (lower === cat || lower === `${cat}s` || lower === `all-${cat}` || lower === `all-${cat}s`) {
      return cat
    }
  }
  return null
}

function getParentCategory(handle: string): string | null {
  const lower = handle.toLowerCase()
  for (const cat of MAIN_CATEGORIES) {
    if (lower.includes(cat)) return cat
  }
  return null
}

// Default fallback menu when Shopify is not connected
const defaultMenuItems: MenuItem[] = [
  {
    label: "Nails",
    href: "/collections/nails",
    submenu: [
      { label: "All Nail Sets", href: "/collections/nails" },
      { label: "French Tips", href: "/collections/french-tips" },
      { label: "Solid Colors", href: "/collections/solid-colors" },
    ]
  },
  {
    label: "Hair",
    href: "/collections/hair",
    submenu: [
      { label: "All Hair Products", href: "/collections/hair" },
      { label: "Hair Extensions", href: "/collections/hair-extensions" },
    ]
  },
  {
    label: "Skin",
    href: "/collections/skin",
    submenu: [
      { label: "All Skin Products", href: "/collections/skin" },
      { label: "Face Care", href: "/collections/face-care" },
    ]
  },
  { label: "Bundles", href: "/collections/bundles" },
  { label: "Blog", href: "/blog" },
  {
    label: "Consult",
    href: "/consult",
    submenu: [
      { label: "Skin Test", href: "/consult/skin" },
      { label: "Hair Test", href: "/consult/hair" }
    ]
  },
  { label: "Sale", href: "/collections/sale" }
]

export async function DynamicHeader() {
  if (!isShopifyConfigured) {
    return <HeaderClient menuItems={defaultMenuItems} />
  }

  let menuItems: MenuItem[] = defaultMenuItems

  try {
    const collections = await getCollections()

    // Separate collections into main categories and subcategories
    const categoryMap: Record<string, { main: { title: string; handle: string } | null; subs: { label: string; href: string }[] }> = {}

    // Initialize categories
    for (const cat of MAIN_CATEGORIES) {
      categoryMap[cat] = { main: null, subs: [] }
    }

    // First pass: find main category collections
    for (const collection of collections) {
      const handle = collection.handle.toLowerCase()
      if (EXCLUDED_HANDLES.includes(handle)) continue

      const mainCat = isMainCategory(handle)
      if (mainCat && categoryMap[mainCat]) {
        categoryMap[mainCat].main = { title: collection.title, handle: collection.handle }
      }
    }

    // Second pass: assign subcategories
    for (const collection of collections) {
      const handle = collection.handle.toLowerCase()
      if (EXCLUDED_HANDLES.includes(handle)) continue
      if (isMainCategory(handle)) continue // Skip main categories

      const parent = getParentCategory(handle)
      if (parent && categoryMap[parent]) {
        categoryMap[parent].subs.push({
          label: collection.title,
          href: `/collections/${collection.handle}`
        })
      }
    }

    // Build dynamic menu items in preferred order
    const dynamicItems: MenuItem[] = []
    const addedCategories = new Set<string>()

    for (const cat of CATEGORY_ORDER) {
      if (addedCategories.has(cat)) continue
      const data = categoryMap[cat]
      if (!data?.main) continue

      // Deduplicate across synonym categories (e.g., skin/skincare)
      const label = CATEGORY_LABELS[cat] || data.main.title
      if ([...addedCategories].some(c => CATEGORY_LABELS[c] === label)) continue

      const submenu = [
        { label: `All ${label}`, href: `/collections/${data.main.handle}` },
        ...data.subs
      ]

      dynamicItems.push({
        label,
        href: `/collections/${data.main.handle}`,
        submenu: submenu.length > 1 ? submenu : undefined,
      })
      addedCategories.add(cat)
    }

    // Add bundles if it exists
    const bundlesCollection = collections.find(c =>
      c.handle.toLowerCase() === 'bundles' || c.handle.toLowerCase() === 'bundle'
    )
    if (bundlesCollection) {
      dynamicItems.push({
        label: bundlesCollection.title,
        href: `/collections/${bundlesCollection.handle}`,
      })
    }

    // Add standalone collections that don't belong to any main category
    for (const collection of collections) {
      const handle = collection.handle.toLowerCase()
      if (EXCLUDED_HANDLES.includes(handle)) continue
      if (isMainCategory(handle)) continue
      if (getParentCategory(handle)) continue
      if (handle === 'bundles' || handle === 'bundle') continue
      if (handle === 'sale' || handle === 'on-sale') continue

      dynamicItems.push({
        label: collection.title,
        href: `/collections/${collection.handle}`,
      })
    }

    // Static pages
    dynamicItems.push(
      { label: "Blog", href: "/blog" },
      {
        label: "Consult",
        href: "/consult",
        submenu: [
          { label: "Skin Test", href: "/consult/skin" },
          { label: "Hair Test", href: "/consult/hair" }
        ]
      }
    )

    // Sale at the end
    const saleCollection = collections.find(c =>
      c.handle.toLowerCase() === 'sale' || c.handle.toLowerCase() === 'on-sale'
    )
    if (saleCollection) {
      dynamicItems.push({
        label: saleCollection.title,
        href: `/collections/${saleCollection.handle}`,
        color: "#B8860B"
      })
    }

    if (dynamicItems.length > 0) {
      menuItems = dynamicItems
    }
  } catch {
    // Fall back to default menu items on error
  }

  return <HeaderClient menuItems={menuItems} />
}
