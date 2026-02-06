import { HeaderClient, MenuItem } from "./header-client"

const menuItems: MenuItem[] = [
  {
    label: "Nails",
    href: "/collections/gel-nail-wraps",
    submenu: [
      { label: "All Gel Nail Wraps", href: "/collections/gel-nail-wraps" },
      { label: "French Styles", href: "/collections/french-styles" },
    ],
  },
  {
    label: "Hair",
    href: "/collections/haircare",
  },
  {
    label: "Skin",
    href: "/collections/skincare",
  },
  {
    label: "Treatments",
    href: "/collections/treatments",
  },
  { label: "Blog", href: "/blog" },
  { label: "Consult", href: "/consult" },
]

export function DynamicHeader() {
  return <HeaderClient menuItems={menuItems} />
}
