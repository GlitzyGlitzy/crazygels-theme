"""
Ulta Beauty product scraper.

Scrapes product listings and detail pages from ulta.com, targeting
skincare, haircare, and bath/body categories.

Ulta uses server-rendered pages so standard aiohttp requests via
_fetch() are sufficient (no Playwright needed for most pages).

Usage:
    python scrapers/ulta/scraper_api.py --pages 2 --output data/ulta_intelligence.json
    python scrapers/ulta/scraper_api.py --pages 1 --category skincare_serums
"""

import argparse
import asyncio
import hashlib
import json
import logging
import os
import re
import sys
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scrapers.common.base import BaseScraper
from scrapers.common.models import Product, PricePoint, ScraperResult, Source, Category

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://www.ulta.com"

# Category slug -> (URL path, Category enum)
# Updated Feb 2026: Ulta now uses /shop/ URL structure
CATEGORY_MAP = {
    "skincare_serums": ("/shop/skin-care/treatment-serums/face-serums", Category.SERUMS),
    "skincare_moisturizers": ("/shop/skin-care/moisturizers/face-moisturizers", Category.MOISTURIZERS),
    "skincare_toners": ("/shop/skin-care/toners", Category.TONERS),
    "skincare_masks": ("/shop/skin-care/masks-peels/face-masks", Category.FACE_MASKS),
    "skincare_cleansers": ("/shop/skin-care/cleansers/face-wash", Category.SKINCARE),
    "skincare_sunscreen": ("/shop/skin-care/sunscreen/face-sunscreen", Category.SKINCARE),
    "fragrances": ("/shop/fragrance/womens-fragrance/perfume", Category.FRAGRANCES),
    "haircare_shampoo": ("/shop/hair-care/shampoo-conditioner/shampoo", Category.SHAMPOO_CONDITIONER),
    "haircare_treatments": ("/shop/hair-care/hair-treatments/hair-masks", Category.HAIRCARE),
    "nail_care": ("/shop/nails/nail-polish", Category.NAIL_CARE),
}

DEFAULT_CATEGORIES = [
    "skincare_serums",
    "skincare_moisturizers",
    "skincare_sunscreen",
    "haircare_shampoo",
]


class UltaScraper(BaseScraper):
    """Scraper for ulta.com product pages."""

    def __init__(
        self,
        pages_per_category: int = 2,
        category_filter: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            source=Source.ULTA,
            max_concurrent=3,
            request_delay=(1.5, 4.0),
            max_retries=3,
            timeout=30,
            **kwargs,
        )
        self.pages_per_category = pages_per_category
        self.category_filter = category_filter
        self._categories = (
            {category_filter: CATEGORY_MAP[category_filter]}
            if category_filter and category_filter in CATEGORY_MAP
            else {k: CATEGORY_MAP[k] for k in DEFAULT_CATEGORIES}
        )

    async def get_category_urls(self) -> list[str]:
        """Generate paginated category listing URLs."""
        urls = []
        for cat_key, (path, _) in self._categories.items():
            for page in range(1, self.pages_per_category + 1):
                separator = "&" if "?" in path else "?"
                url = f"{BASE_URL}{path}{separator}page={page}"
                urls.append(url)
        return urls

    async def parse_listing(self, html: str, url: str) -> list[str]:
        """Extract product URLs from an Ulta listing page."""
        soup = BeautifulSoup(html, "html.parser")
        product_urls = []
        seen = set()

        # Modern Ulta product listing selectors (updated Feb 2026)
        selectors = [
            # Product card links on /shop/ pages
            "a[href*='/p/']",
            "a[href*='productId']",
            "[data-testid='product-card'] a",
            ".ProductCard a",
            ".product-card a",
            "a.ProductCard",
            # Grid item links
            ".ProductListingResults a[href*='/p/']",
            "[class*='ProductGrid'] a[href*='/p/']",
            "[class*='product-grid'] a[href*='/p/']",
        ]

        for selector in selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get("href", "")
                if not href:
                    continue
                full_url = urljoin(BASE_URL, href)
                # Accept /p/ product URLs and productId URLs
                if ("/p/" in full_url or "productId" in full_url) and full_url not in seen:
                    seen.add(full_url)
                    product_urls.append(full_url)

        # Fallback: any links that look like product pages
        if not product_urls:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                full_url = urljoin(BASE_URL, href)
                if re.search(r"(/p/|productId=)\w+", full_url) and full_url not in seen:
                    seen.add(full_url)
                    product_urls.append(full_url)

        logger.info(f"[ulta] Found {len(product_urls)} product links on {url}")
        return product_urls

    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse an Ulta product detail page into a Product model."""
        soup = BeautifulSoup(html, "html.parser")

        try:
            # Product name
            name_el = (
                soup.select_one("h1.Text-ds--title-5")
                or soup.select_one(".ProductMainSection h1")
                or soup.select_one("h1[itemprop='name']")
                or soup.select_one("h1")
            )
            name = name_el.get_text(strip=True) if name_el else None
            if not name:
                return None

            # Brand
            brand_el = (
                soup.select_one("a.Anchor[href*='/brand/']")
                or soup.select_one(".ProductMainSection .Text-ds--body-2 a")
                or soup.select_one("[itemprop='brand']")
            )
            brand = brand_el.get_text(strip=True) if brand_el else "Unknown"

            # Price
            price_el = (
                soup.select_one(".ProductPricingPanel span[aria-label*='rice']")
                or soup.select_one("[itemprop='price']")
                or soup.select_one(".ProductPricingPanel .Text-ds--body-1")
            )
            price_text = price_el.get_text(strip=True) if price_el else "0"
            price_val = _extract_price(price_text)

            # Sale price
            sale_el = soup.select_one(".ProductPricingPanel .Text-ds--body-1--red")
            sale_price = _extract_price(sale_el.get_text(strip=True)) if sale_el else None
            # If sale price found, the original price might be different
            if sale_price and sale_price < price_val:
                sale_price, price_val = sale_price, price_val

            # Image
            img_el = (
                soup.select_one("img.ProductHero__image")
                or soup.select_one("#mainImage")
                or soup.select_one(".ProductHero img")
            )
            image_url = img_el.get("src") or img_el.get("data-src") if img_el else None

            # Description
            desc_el = (
                soup.select_one("#product-description")
                or soup.select_one(".ProductDescription")
                or soup.select_one("[itemprop='description']")
            )
            description = desc_el.get_text(strip=True)[:1000] if desc_el else None

            # Rating
            rating_el = (
                soup.select_one("[itemprop='ratingValue']")
                or soup.select_one(".ReviewStarsPreview__number")
            )
            rating = None
            if rating_el:
                try:
                    rating = min(float(rating_el.get("content", rating_el.get_text(strip=True))), 5.0)
                except (ValueError, TypeError):
                    pass

            # Review count
            review_el = (
                soup.select_one("[itemprop='reviewCount']")
                or soup.select_one(".ReviewStarsPreview__count")
            )
            review_count = None
            if review_el:
                count_text = review_el.get("content", review_el.get_text(strip=True))
                count_match = re.search(r"(\d+)", str(count_text))
                if count_match:
                    review_count = int(count_match.group(1))

            # Ingredients
            ingredients_el = (
                soup.select_one("#Ingredients")
                or soup.select_one(".ProductIngredients")
            )
            ingredients = ingredients_el.get_text(strip=True)[:2000] if ingredients_el else None

            # Size
            size_el = soup.select_one(".ProductMainSection .Text-ds--body-3")
            size = size_el.get_text(strip=True) if size_el else None

            # External ID from URL
            external_id = _extract_id_from_url(url) or hashlib.md5(url.encode()).hexdigest()[:16]

            # Determine category from URL
            category = _url_to_category(url)

            return Product(
                source=Source.ULTA,
                external_id=external_id,
                name=name,
                brand=brand,
                url=url,
                category=category,
                price=PricePoint(
                    price=price_val,
                    currency="USD",
                    sale_price=sale_price,
                    in_stock=True,
                ),
                image_url=image_url,
                description=description,
                rating=rating,
                review_count=review_count,
                ingredients=ingredients,
                size=size,
                sku=external_id,
                tags=["ulta"],
            )

        except Exception as e:
            logger.error(f"[ulta] Failed to parse product from {url}: {e}")
            return None


# ── Helpers ──────────────────────────────────────────────────

def _extract_price(text: str) -> float:
    """Extract numeric price from text like '$29.99' or '29.99'."""
    if not text:
        return 0.0
    cleaned = re.sub(r"[^\d.]", "", text)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _extract_id_from_url(url: str) -> Optional[str]:
    """Extract product ID from Ulta URL patterns."""
    # Pattern: ?productId=xlsImpprod12345
    match = re.search(r"productId=(\w+)", url)
    if match:
        return f"ulta_{match.group(1)}"

    # Pattern: /ulta/brand-name-product-name?productId=...
    match = re.search(r"/ulta/([^?]+)", url)
    if match:
        return f"ulta_{hashlib.md5(match.group(1).encode()).hexdigest()[:12]}"

    return None


def _url_to_category(url: str) -> Category:
    """Determine product category from URL path."""
    url_lower = url.lower()
    if "serum" in url_lower:
        return Category.SERUMS
    if "moisturiz" in url_lower:
        return Category.MOISTURIZERS
    if "toner" in url_lower:
        return Category.TONERS
    if "mask" in url_lower:
        return Category.FACE_MASKS
    if "fragrance" in url_lower or "perfume" in url_lower or "cologne" in url_lower:
        return Category.FRAGRANCES
    if "shampoo" in url_lower or "conditioner" in url_lower:
        return Category.SHAMPOO_CONDITIONER
    if "hair" in url_lower:
        return Category.HAIRCARE
    if "nail" in url_lower:
        return Category.NAIL_CARE
    return Category.SKINCARE


def _anonymise_product(product: Product) -> dict:
    """Convert a Product to an anonymised intelligence dict."""
    hash_input = f"{product.source.value}:{product.external_id}:{product.name}"
    product_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    # USD price tiers
    price = product.price.price
    if price > 80:
        price_tier = "luxury"
    elif price > 40:
        price_tier = "premium"
    elif price > 15:
        price_tier = "mid"
    else:
        price_tier = "budget"

    # Brand tier (Ulta carries both prestige and mass market)
    prestige_brands = {"estee lauder", "clinique", "lancome", "shiseido", "origins", "murad"}
    brand_lower = product.brand.lower()
    if brand_lower in prestige_brands:
        brand_type = "premium"
    elif price > 40:
        brand_type = "premium"
    elif price > 15:
        brand_type = "mid_range"
    else:
        brand_type = "mass_market"

    return {
        "product_hash": product_hash,
        "source": "ulta",
        "category": product.category.value,
        "name_clean": product.name[:255],
        "brand_type": brand_type,
        "price_tier": price_tier,
        "efficacy_signals": {
            "rating": product.rating,
            "review_count": product.review_count,
            "has_ingredients": bool(product.ingredients),
        },
        "ingredient_profile": _extract_ingredient_profile(product.ingredients),
        "market_signals": {
            "in_stock": product.price.in_stock,
            "has_sale": product.price.sale_price is not None,
            "sale_discount": (
                round((1 - product.price.sale_price / product.price.price) * 100, 1)
                if product.price.sale_price and product.price.price > 0
                else None
            ),
        },
        "acquisition_lead": f"ACQ-{product_hash[:8].upper()}",
        "last_updated": datetime.utcnow().isoformat(),
    }


def _extract_ingredient_profile(ingredients_text: Optional[str]) -> dict:
    """Extract key actives from ingredient list."""
    if not ingredients_text:
        return {"actives": [], "notable": []}

    text_lower = ingredients_text.lower()
    actives = []
    notable = []

    active_keywords = {
        "niacinamide": "niacinamide",
        "retinol": "retinol",
        "hyaluronic acid": "hyaluronic_acid",
        "salicylic acid": "salicylic_acid",
        "glycolic acid": "glycolic_acid",
        "lactic acid": "lactic_acid",
        "vitamin c": "vitamin_c",
        "ascorbic acid": "vitamin_c",
        "azelaic acid": "azelaic_acid",
        "ceramide": "ceramide",
        "peptide": "peptide",
        "squalane": "squalane",
        "centella": "centella",
        "bakuchiol": "bakuchiol",
        "benzoyl peroxide": "benzoyl_peroxide",
    }

    for keyword, active_name in active_keywords.items():
        if keyword in text_lower:
            actives.append(active_name)

    for keyword in ["fragrance", "alcohol denat", "parfum"]:
        if keyword in text_lower:
            notable.append(keyword.replace(" ", "_"))

    return {"actives": actives, "notable": notable}


# ── CLI entrypoint ───────────────────────────────────────────

async def run(pages: int, output: str, category: Optional[str] = None):
    """Run the Ulta scraper and write results to JSON."""
    scraper = UltaScraper(pages_per_category=pages, category_filter=category)
    async with scraper:
        result = await scraper.scrape()

    anonymised = [_anonymise_product(p) for p in result.products]

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, "w") as f:
        json.dump(anonymised, f, indent=2, ensure_ascii=False)

    logger.info(f"Wrote {len(anonymised)} anonymised products to {output}")
    return len(anonymised)


def main():
    parser = argparse.ArgumentParser(description="Ulta Beauty product scraper")
    parser.add_argument("--pages", type=int, default=2, help="Pages per category (default: 2)")
    parser.add_argument("--output", default="data/ulta_intelligence.json", help="Output JSON path")
    parser.add_argument("--category", default=None, help="Single category key to scrape")
    args = parser.parse_args()

    asyncio.run(run(args.pages, args.output, args.category))


if __name__ == "__main__":
    main()
