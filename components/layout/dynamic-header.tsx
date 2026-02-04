import { getCollections, isShopifyConfigured } from "@/lib/shopify"
import { HeaderClient, MenuItem } from "./header-client"

// Map collection handles to their color accents - luxury palette
const categoryColors: Record<string, string> = {
  nails: "#D4AF37",
  nail: "#D4AF37",
  hair: "#8B7355",
  skin: "#C9A9A6",
  skincare: "#C9A9A6",
  treatments: "#C9A9A6",
  bundles: "#B8860B",
  sale: "#B8860B",
  new: "#D4AF37",
  featured: "#D4AF37",
}

// Main category keywords for grouping
const mainCategoryKeywords = ['nails', 'nail', 'hair', 'skin', 'skincare', 'treatments', 'body', 'face']

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
      console.log(`[v0] DynamicHeader: Fetched ${collections.length} collections from Shopify`)
      
      // Log all collection handles for debugging
      collections.forEach(c => {
        console.log(`[v0] DynamicHeader: Collection - "${c.title}" (${c.handle})`)
      })
      
      // Filter and organize collections into categories
      const mainCategories = ['nails', 'nail', 'hair', 'skin', 'skincare', 'treatments']
      const categoryCollections: Record<string, MenuItem> = {}
      
      // First pass: identify all main categories
      collections.forEach((collection) => {
        const handle = collection.handle.toLowerCase()
        
        // Skip system collections
        if (handle === 'all' || handle === 'frontpage' || handle === 'all-products') return
        
        // Check if this is a main category (exact match or plural form)
        const isMainCategory = mainCategories.some(cat => 
          handle === cat || 
          handle === `${cat}s` || 
          handle === `all-${cat}` ||
          handle === `all-${cat}s`
        )
        
        if (isMainCategory) {
          const categoryKey = mainCategories.find(cat => handle.includes(cat)) || handle
          if (!categoryCollections[categoryKey]) {
            categoryCollections[categoryKey] = {
              label: collection.title,
              href: `/collections/${collection.handle}`,
              color: getCategoryColor(handle),
              submenu: [{ label: `All ${collection.title}`, href: `/collections/${collection.handle}` }]
            }
            console.log(`[v0] DynamicHeader: Created main category "${collection.title}" for ${categoryKey}`)
          }
        }
      })
      
      // Second pass: add subcategories to their parent categories
      collections.forEach((collection) => {
        const handle = collection.handle.toLowerCase()
        
        // Skip system collections and main categories already processed
        if (handle === 'all' || handle === 'frontpage' || handle === 'all-products') return
        
        const isMainCategory = mainCategories.some(cat => 
          handle === cat || 
          handle === `${cat}s` || 
          handle === `all-${cat}` ||
          handle === `all-${cat}s`
        )
        
        if (!isMainCategory) {
          // Find which parent category this belongs to
          const parentCategory = mainCategories.find(cat => handle.includes(cat))
          
          if (parentCategory && categoryCollections[parentCategory]) {
            // Add as subcategory
            categoryCollections[parentCategory].submenu?.push({
              label: collection.title,
              href: `/collections/${collection.handle}`
            })
            console.log(`[v0] DynamicHeader: Added subcategory "${collection.title}" to ${parentCategory}`)
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
            console.log(`[v0] DynamicHeader: Created category ${parentCategory} with subcategory "${collection.title}"`)
          }
        }
      })

      // Build menu items from discovered categories
      const dynamicMenuItems: MenuItem[] = []
      
      // Add main categories in preferred order
      const categoryOrder = ['nail', 'nails', 'hair', 'skin', 'skincare', 'treatments']
      const addedCategories = new Set<string>()
      
      categoryOrder.forEach(cat => {
        if (categoryCollections[cat] && !addedCategories.has(cat)) {
          dynamicMenuItems.push(categoryCollections[cat])
          addedCategories.add(cat)
          console.log(`[v0] DynamicHeader: Added "${categoryCollections[cat].label}" to menu`)
        }
      })

      // Add remaining categories not in the preferred order
      Object.entries(categoryCollections).forEach(([key, item]) => {
        if (!addedCategories.has(key)) {
          dynamicMenuItems.push(item)
          addedCategories.add(key)
          console.log(`[v0] DynamicHeader: Added "${item.label}" to menu (additional)`)
        }
      })

      // Check if bundles collection exists
      const bundlesCollection = collections.find(c => 
        c.handle.toLowerCase() === 'bundles' || c.handle.toLowerCase() === 'bundle'
      )
      if (bundlesCollection) {
        dynamicMenuItems.push({
          label: bundlesCollection.title,
          href: `/collections/${bundlesCollection.handle}`,
          color: categoryColors.bundles
        })
        console.log(`[v0] DynamicHeader: Added "Bundles" to menu`)
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
      const saleCollection = collections.find(c => 
        c.handle.toLowerCase() === 'sale' || c.handle.toLowerCase() === 'on-sale'
      )
      if (saleCollection) {
        dynamicMenuItems.push({
          label: saleCollection.title,
          href: `/collections/${saleCollection.handle}`,
          color: categoryColors.sale
        })
        console.log(`[v0] DynamicHeader: Added "Sale" to menu`)
      }

      // Log final menu structure
      console.log(`[v0] DynamicHeader: Final menu has ${dynamicMenuItems.length} items`)
      dynamicMenuItems.forEach(item => {
        const subCount = item.submenu?.length || 0
        console.log(`[v0] DynamicHeader: Menu item "${item.label}" with ${subCount} submenu items`)
      })

      if (dynamicMenuItems.length > 0) {
        menuItems = dynamicMenuItems
      }
    } catch (error: any) {
      // Fall back to default menu items on error
      console.error("[v0] DynamicHeader: Error fetching collections:", error?.message || error)
    }
  }

  return <HeaderClient menuItems={menuItems} />
}
