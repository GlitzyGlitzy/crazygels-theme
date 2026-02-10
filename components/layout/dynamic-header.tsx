import { HeaderClient, MenuItem } from "./header-client"

const menuItems: MenuItem[] = [
  {
    label: "Nails",
    href: "/collections/gel-nail-wraps",
    submenu: [
      { label: "All Gel Nail Wraps", href: "/collections/gel-nail-wraps" },
      { label: "French Tips", href: "/collections/gel-nail-wraps?subcategory=french-tips" },
      { label: "Solid Colors", href: "/collections/gel-nail-wraps?subcategory=solid-colors" },
      { label: "Glitter & Shimmer", href: "/collections/gel-nail-wraps?subcategory=glitter-shimmer" },
      { label: "Floral", href: "/collections/gel-nail-wraps?subcategory=floral" },
      { label: "Marble & Abstract", href: "/collections/gel-nail-wraps?subcategory=marble-abstract" },
      { label: "Seasonal", href: "/collections/gel-nail-wraps?subcategory=seasonal" },
      { label: "Sets & Bundles", href: "/collections/gel-nail-wraps?subcategory=sets" },
      { label: "Pedicure", href: "/collections/gel-nail-wraps?subcategory=pedicure" },
    ],
  },
  {
    label: "Hair",
    href: "/collections/haircare",
    submenu: [
      { label: "All Hair Products", href: "/collections/haircare" },
      { label: "Shampoo", href: "/collections/haircare?subcategory=shampoo" },
      { label: "Conditioner", href: "/collections/haircare?subcategory=conditioner" },
      { label: "Hair Masks", href: "/collections/haircare?subcategory=hair-masks" },
      { label: "Oils & Serums", href: "/collections/haircare?subcategory=oils-serums" },
      { label: "Leave-In Products", href: "/collections/haircare?subcategory=leave-in" },
      { label: "Styling", href: "/collections/haircare?subcategory=styling" },
      { label: "Hair Growth & Scalp", href: "/collections/haircare?subcategory=hair-growth" },
      { label: "Color Care", href: "/collections/haircare?subcategory=color-care" },
      { label: "Tools & Accessories", href: "/collections/haircare?subcategory=tools" },
    ],
  },
  {
    label: "Skin",
    href: "/collections/skincare",
    submenu: [
      { label: "All Skincare", href: "/collections/skincare" },
      { label: "Face Creams", href: "/collections/skincare?subcategory=face-cream" },
      { label: "Wash Gels & Cleansers", href: "/collections/skincare?subcategory=wash-gels" },
      { label: "Toners & Essences", href: "/collections/skincare?subcategory=toners" },
      { label: "Serums", href: "/collections/skincare?subcategory=serums" },
      { label: "Face Masks", href: "/collections/skincare?subcategory=face-masks" },
      { label: "Eye Care", href: "/collections/skincare?subcategory=eye-care" },
      { label: "Sun Protection", href: "/collections/skincare?subcategory=sun-protection" },
      { label: "Lip Care", href: "/collections/skincare?subcategory=lip-care" },
      { label: "Body Care", href: "/collections/skincare?subcategory=body-care" },
    ],
  },
  {
    label: "Fragrances",
    href: "/collections/fragrances",
    submenu: [
      { label: "All Fragrances", href: "/collections/fragrances" },
      { label: "Perfumes", href: "/collections/fragrances?subcategory=perfumes" },
      { label: "Body Mists", href: "/collections/fragrances?subcategory=body-mists" },
      { label: "Gift Sets", href: "/collections/fragrances?subcategory=gift-sets" },
    ],
  },
  {
    label: "Treatments",
    href: "/collections/treatments",
    submenu: [
      { label: "All Treatments", href: "/collections/treatments" },
      { label: "UV & LED Lamps", href: "/collections/treatments?subcategory=uv-lamps" },
      { label: "Nail Accessories", href: "/collections/treatments?subcategory=nail-accessories" },
      { label: "Beauty Tools", href: "/collections/treatments?subcategory=beauty-tools" },
      { label: "Sets & Kits", href: "/collections/treatments?subcategory=sets" },
    ],
  },
  { label: "Blog", href: "/blog" },
  {
    label: "Consult",
    href: "/consult",
    submenu: [
      { label: "Skin Consultation", href: "/consult/skin" },
      { label: "Hair Consultation", href: "/consult/hair" },
    ],
  },
]

export function DynamicHeader() {
  return <HeaderClient menuItems={menuItems} />
}
