import { getCollections, isShopifyConfigured } from "@/lib/shopify"
import { HeaderClient, MenuItem } from "./header-client"

// Map collection handles to their color accents
const categoryColors: Record<string, string> = {
  nails: "#ff00b0",
  nail: "#ff00b0",
  hair: "#7c3aed",
  skin: "#06b6d4",
  skincare: "#06b6d4",
  bundles: "#feca57",
  sale: "#ff6b6b",
}

function getCategoryColor(handle: string): string | undefined {
  const lowerHandle = handle.toLowerCase()
  for (const [key, color] of Object.entries(categoryColors)) {
    if (lowerHandle.includes(key)) return color
  }
  return undefined
}

// Default menu items as fallback
const defaultMenuItems: MenuItem[] = [
  {
    label: "Nails",
    href: "/collections/nails",
    submenu: [
      { label: "All Nail Sets", href: "/collections/nails" },
      { label: "French Tips", href: "/collections/french-tips" },
      { label: "Solid Colors", href: "/collections/solid-colors" },
      { label: "Glitter & Sparkle", href: "/collections/glitter" },
      { label: "Nail Art", href: "/collections/nail-art" },
      { label: "New Arrivals", href: "/collections/new-nails" }
    ]
  },
  {
    label: "Hair",
    href: "/collections/hair",
    submenu: [
      { label: "All Hair Products", href: "/collections/hair" },
      { label: "Hair Extensions", href: "/collections/hair-extensions" },
      { label: "Hair Care", href: "/collections/hair-care" },
      { label: "Styling Tools", href: "/collections/styling-tools" }
    ]
  },
  {
    label: "Skin",
    href: "/collections/skin",
    submenu: [
      { label: "All Skin Products", href: "/collections/skin" },
      { label: "Face Care", href: "/collections/face-care" },
      { label: "Body Care", href: "/collections/body-care" },
      { label: "Lip Care", href: "/collections/lip-care" }
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
  let menuItems: MenuItem[] = defaultMenuItems

  if (isShopifyConfigured) {
    try {
      const collections = await getCollections()
      
      // Filter and organize collections into categories
      const mainCategories = ['nails', 'nail', 'hair', 'skin', 'skincare']
      const categoryCollections: Record<string, MenuItem> = {}
      
      collections.forEach((collection) => {
        const handle = collection.handle.toLowerCase()
        
        // Skip system collections
        if (handle === 'all' || handle === 'frontpage') return
        
        // Check if this is a main category or a subcategory
        const isMainCategory = mainCategories.some(cat => handle === cat || handle === `${cat}s`)
        const parentCategory = mainCategories.find(cat => handle.includes(cat))
        
        if (isMainCategory) {
          // This is a main category
          const categoryKey = parentCategory || handle
          if (!categoryCollections[categoryKey]) {
            categoryCollections[categoryKey] = {
              label: collection.title,
              href: `/collections/${collection.handle}`,
              color: getCategoryColor(handle),
              submenu: [{ label: `All ${collection.title}`, href: `/collections/${collection.handle}` }]
            }
          }
        } else if (parentCategory && categoryCollections[parentCategory]) {
          // This is a subcategory
          categoryCollections[parentCategory].submenu?.push({
            label: collection.title,
            href: `/collections/${collection.handle}`
          })
        } else if (parentCategory) {
          // Parent doesn't exist yet, create it with this as first subcategory
          categoryCollections[parentCategory] = {
            label: parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1),
            href: `/collections/${parentCategory}`,
            color: getCategoryColor(parentCategory),
            submenu: [
              { label: `All ${parentCategory.charAt(0).toUpperCase() + parentCategory.slice(1)}`, href: `/collections/${parentCategory}` },
              { label: collection.title, href: `/collections/${collection.handle}` }
            ]
          }
        }
      })

      // Build menu items from discovered categories
      const dynamicMenuItems: MenuItem[] = []
      
      // Add main categories in order
      const categoryOrder = ['nail', 'nails', 'hair', 'skin', 'skincare']
      const addedCategories = new Set<string>()
      
      categoryOrder.forEach(cat => {
        if (categoryCollections[cat] && !addedCategories.has(cat)) {
          dynamicMenuItems.push(categoryCollections[cat])
          addedCategories.add(cat)
        }
      })

      // Add remaining categories
      Object.entries(categoryCollections).forEach(([key, item]) => {
        if (!addedCategories.has(key)) {
          dynamicMenuItems.push(item)
          addedCategories.add(key)
        }
      })

      // Check if bundles collection exists
      const bundlesCollection = collections.find(c => c.handle.toLowerCase() === 'bundles')
      if (bundlesCollection) {
        dynamicMenuItems.push({
          label: "Bundles",
          href: "/collections/bundles",
          color: categoryColors.bundles
        })
      }

      // Add static menu items
      dynamicMenuItems.push(
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

      // Check if sale collection exists
      const saleCollection = collections.find(c => c.handle.toLowerCase() === 'sale')
      if (saleCollection) {
        dynamicMenuItems.push({
          label: "Sale",
          href: "/collections/sale",
          color: categoryColors.sale
        })
      }

      if (dynamicMenuItems.length > 0) {
        menuItems = dynamicMenuItems
      }
    } catch (error) {
      // Fall back to default menu items on error
      console.error("[v0] Error fetching collections for header:", error)
    }
  }

  return <HeaderClient menuItems={menuItems} />
}
