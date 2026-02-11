"""
Sephora DE product scraper.

Scrapes product listings and detail pages from sephora.de, targeting
skincare, haircare, fragrance, and nail categories relevant to CrazyGels.

Uses Playwright (via _fetch_js) for JS-rendered pages since Sephora
heavily relies on client-side rendering and anti-bot detection.

Usage:
    python scrapers/sephora/scraper_api.py --pages 2 --output data/sephora_intelligence.json
    python scrapers/sephora/scraper_api.py --pages 1 --category skincare_serums
"""

import argparse
import asyncio
import hashlib
import json
import logging
import os
import re
import sys
from dataclasses import asdict
from datetime import datetime
from typing import Optional
from urllib.parse import urljoin, urlparse, parse_qs

from bs4 import BeautifulSoup

# Ensure project root is on path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scrapers.common.base import BaseScraper
from scrapers.common.models import Product, PricePoint, ScraperResult, Source, Category

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://www.sephora.de"

# Category slug -> (URL path, Category enum)
CATEGORY_MAP = {
    "skincare_serums": ("/skincare/seren-essenzen/", Category.SERUMS),
    "skincare_moisturizers": ("/skincare/gesichtspflege/feuchtigkeitspflege/", Category.MOISTURIZERS),
    "skincare_toners": ("/skincare/gesichtspflege/toner-gesichtswasser/", Category.TONERS),
    "skincare_masks": ("/skincare/gesichtspflege/masken/", Category.FACE_MASKS),
    "fragrances": ("/parfum/", Category.FRAGRANCES),
    "haircare": ("/haare/", Category.HAIRCARE),
    "haircare_shampoo": ("/haare/shampoo/", Category.SHAMPOO_CONDITIONER),
    "nail_care": ("/makeup/naegel/", Category.NAIL_CARE),
}

# Default categories to scrape if none specified
DEFAULT_CATEGORIES = [
    "skincare_serums",
    "skincare_moisturizers",
    "skincare_toners",
    "fragrances",
    "haircare_shampoo",
]


class SephoraScraper(BaseScraper):
    """Scraper for sephora.de product pages."""

    def __init__(
        self,
        pages_per_category: int = 2,
        category_filter: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            source=Source.SEPHORA,
            max_concurrent=2,
            request_delay=(2.0, 5.0),
            max_retries=3,
            timeout=45,
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
        """Extract product detail page URLs from a category listing page."""
        soup = BeautifulSoup(html, "html.parser")
        product_urls = []

        # Sephora uses product grid with links to detail pages
        # Try multiple selector patterns for resilience
        selectors = [
            "a[data-comp='ProductTile']",
            "a.css-ix8km1",
            ".product-tile a",
            "a[href*='/produkte/']",
            ".product-grid a[href*='/p/']",
        ]

        seen = set()
        for selector in selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get("href", "")
                if not href:
                    continue
                full_url = urljoin(BASE_URL, href)
                # Filter to actual product pages
                if "/produkte/" in full_url or "/p/" in full_url:
                    if full_url not in seen:
                        seen.add(full_url)
                        product_urls.append(full_url)

        # Fallback: find any links that look like product pages
        if not product_urls:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                full_url = urljoin(BASE_URL, href)
                if re.search(r"/produkte/[^/]+/[^/]+", full_url) or re.search(r"/p/\w+", full_url):
                    if full_url not in seen:
                        seen.add(full_url)
                        product_urls.append(full_url)

        logger.info(f"[sephora] Found {len(product_urls)} product links on {url}")
        return product_urls

    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse a Sephora product detail page into a Product model."""
        soup = BeautifulSoup(html, "html.parser")

        try:
            # Product name
            name_el = (
                soup.select_one("h1[data-comp='DisplayName']")
                or soup.select_one("h1.product-name")
                or soup.select_one("h1")
            )
            name = name_el.get_text(strip=True) if name_el else None
            if not name:
                return None

            # Brand
            brand_el = (
                soup.select_one("a[data-comp='BrandName']")
                or soup.select_one(".brand-name")
                or soup.select_one("a[href*='/marken/']")
            )
            brand = brand_el.get_text(strip=True) if brand_el else "Unknown"

            # Price
            price_el = (
                soup.select_one("[data-comp='Price'] span")
                or soup.select_one(".product-price")
                or soup.select_one(".price")
            )
            price_text = price_el.get_text(strip=True) if price_el else "0"
            price_val = _extract_price(price_text)

            # Sale price
            sale_el = soup.select_one(".sale-price, .price--sale, [data-comp='SalePrice']")
            sale_price = _extract_price(sale_el.get_text(strip=True)) if sale_el else None

            # Image
            img_el = (
                soup.select_one("img[data-comp='ProductImage']")
                or soup.select_one(".product-image img")
                or soup.select_one("img.primary-image")
            )
            image_url = img_el.get("src") or img_el.get("data-src") if img_el else None

            # Description
            desc_el = (
                soup.select_one("[data-comp='ProductDescription']")
                or soup.select_one(".product-description")
            )
            description = desc_el.get_text(strip=True)[:1000] if desc_el else None

            # Rating
            rating_el = soup.select_one("[data-comp='StarRating']") or soup.select_one(".rating")
            rating = None
            if rating_el:
                rating_text = rating_el.get("aria-label", "") or rating_el.get_text(strip=True)
                rating_match = re.search(r"([\d.]+)\s*/?\s*5?", rating_text)
                if rating_match:
                    rating = min(float(rating_match.group(1)), 5.0)

            # Review count
            review_el = soup.select_one("[data-comp='ReviewCount']") or soup.select_one(".review-count")
            review_count = None
            if review_el:
                count_match = re.search(r"(\d+)", review_el.get_text())
                if count_match:
                    review_count = int(count_match.group(1))

            # Ingredients
            ingredients_el = (
                soup.select_one("#ingredients")
                or soup.select_one("[data-comp='Ingredients']")
                or soup.select_one(".ingredients-content")
            )
            ingredients = ingredients_el.get_text(strip=True)[:2000] if ingredients_el else None

            # Size
            size_el = soup.select_one(".product-size") or soup.select_one("[data-comp='Size']")
            size = size_el.get_text(strip=True) if size_el else None

            # SKU / External ID from URL
            external_id = _extract_id_from_url(url) or hashlib.md5(url.encode()).hexdigest()[:16]

            # Determine category from URL
            category = _url_to_category(url)

            return Product(
                source=Source.SEPHORA,
                external_id=external_id,
                name=name,
                brand=brand,
                url=url,
                category=category,
                price=PricePoint(
                    price=price_val,
                    currency="EUR",
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
                tags=["sephora_de"],
            )

        except Exception as e:
            logger.error(f"[sephora] Failed to parse product from {url}: {e}")
            return None

    async def scrape(self) -> ScraperResult:
        """Override to use _fetch_js for JS-rendered pages."""
        started_at = datetime.utcnow()
        products: list[Product] = []
        errors: list[str] = []
        total_pages = 0

        logger.info(f"[{self.source.value}] Starting scrape (JS mode)...")

        category_urls = await self.get_category_urls()
        product_urls: list[str] = []

        # Phase 1: Collect product URLs from listing pages (use JS rendering)
        for cat_url in category_urls:
            html = await self._fetch_js(cat_url, wait_selector=".product-tile, [data-comp='ProductTile'], a[href*='/produkte/']")
            if html:
                total_pages += 1
                try:
                    urls = await self.parse_listing(html, cat_url)
                    product_urls.extend(urls)
                except Exception as e:
                    errors.append(f"Listing parse error ({cat_url}): {e}")

        # Deduplicate
        product_urls = list(set(product_urls))
        logger.info(f"[{self.source.value}] Found {len(product_urls)} unique product URLs")

        # Phase 2: Scrape individual product pages
        for url in product_urls:
            html = await self._fetch_js(url, wait_selector="h1, .product-name")
            if html:
                total_pages += 1
                try:
                    product = await self.parse_product(html, url)
                    if product:
                        products.append(product)
                except Exception as e:
                    errors.append(f"Product parse error ({url}): {e}")

        finished_at = datetime.utcnow()
        result = ScraperResult(
            source=self.source,
            products=products,
            started_at=started_at,
            finished_at=finished_at,
            total_pages=total_pages,
            errors=errors,
        )
        logger.info(
            f"[{self.source.value}] Scrape complete: "
            f"{len(products)} products, {len(errors)} errors, "
            f"{result.duration_seconds:.1f}s"
        )
        return result


# ── Helpers ──────────────────────────────────────────────────

def _extract_price(text: str) -> float:
    """Extract numeric price from text like '29,90 EUR' or '29.90'."""
    if not text:
        return 0.0
    # Handle European format (comma as decimal separator)
    cleaned = re.sub(r"[^\d,.]", "", text)
    cleaned = cleaned.replace(",", ".")
    # If multiple dots, keep only the last one (thousands separator)
    parts = cleaned.rsplit(".", 1)
    if len(parts) == 2:
        cleaned = parts[0].replace(".", "") + "." + parts[1]
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _extract_id_from_url(url: str) -> Optional[str]:
    """Extract product ID from Sephora URL patterns."""
    # Pattern: /produkte/brand-name/product-name-P12345678
    match = re.search(r"-P(\d+)$", urlparse(url).path)
    if match:
        return f"sephora_{match.group(1)}"

    # Pattern: /p/SKU12345
    match = re.search(r"/p/(\w+)", url)
    if match:
        return f"sephora_{match.group(1)}"

    return None


def _url_to_category(url: str) -> Category:
    """Determine product category from URL path."""
    path = urlparse(url).path.lower()
    if "seren" in path or "serum" in path:
        return Category.SERUMS
    if "feuchtigkeitspflege" in path or "moisturiz" in path:
        return Category.MOISTURIZERS
    if "toner" in path or "gesichtswasser" in path:
        return Category.TONERS
    if "masken" in path or "mask" in path:
        return Category.FACE_MASKS
    if "parfum" in path or "fragrance" in path:
        return Category.FRAGRANCES
    if "shampoo" in path or "conditioner" in path:
        return Category.SHAMPOO_CONDITIONER
    if "haare" in path or "hair" in path:
        return Category.HAIRCARE
    if "nagel" in path or "nail" in path:
        return Category.NAIL_CARE
    return Category.SKINCARE


def _anonymise_product(product: Product) -> dict:
    """Convert a Product to an anonymised intelligence dict for output."""
    hash_input = f"{product.source.value}:{product.external_id}:{product.name}"
    product_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    # Determine brand type tier
    premium_brands = {"la mer", "sk-ii", "augustinus bader", "la prairie", "sisley"}
    mid_brands = {"clinique", "estee lauder", "lancome", "shiseido", "origins"}
    brand_lower = product.brand.lower()

    if brand_lower in premium_brands:
        brand_type = "luxury"
    elif brand_lower in mid_brands:
        brand_type = "premium"
    elif product.price.price > 80:
        brand_type = "premium"
    elif product.price.price > 30:
        brand_type = "mid_range"
    else:
        brand_type = "mass_market"

    # Determine price tier
    price = product.price.price
    if price > 100:
        price_tier = "luxury"
    elif price > 50:
        price_tier = "premium"
    elif price > 20:
        price_tier = "mid"
    else:
        price_tier = "budget"

    return {
        "product_hash": product_hash,
        "source": "sephora_de",
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
    """Extract key actives and ingredient groups from ingredient list."""
    if not ingredients_text:
        return {"actives": [], "notable": []}

    text_lower = ingredients_text.lower()
    actives = []
    notable = []

    active_keywords = {
        "niacinamide": "niacinamide",
        "retinol": "retinol",
        "retinal": "retinal",
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
        "tranexamic": "tranexamic_acid",
    }

    for keyword, active_name in active_keywords.items():
        if keyword in text_lower:
            actives.append(active_name)

    notable_keywords = ["fragrance", "alcohol denat", "essential oil", "parfum"]
    for keyword in notable_keywords:
        if keyword in text_lower:
            notable.append(keyword.replace(" ", "_"))

    return {"actives": actives, "notable": notable}


# ── CLI entrypoint ───────────────────────────────────────────

async def run(pages: int, output: str, category: Optional[str] = None):
    """Run the Sephora scraper and write results to JSON."""
    scraper = SephoraScraper(pages_per_category=pages, category_filter=category)
    async with scraper:
        result = await scraper.scrape()

    # Convert to anonymised output
    anonymised = [_anonymise_product(p) for p in result.products]

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, "w") as f:
        json.dump(anonymised, f, indent=2, ensure_ascii=False)

    logger.info(f"Wrote {len(anonymised)} anonymised products to {output}")
    return len(anonymised)


def main():
    parser = argparse.ArgumentParser(description="Sephora DE product scraper")
    parser.add_argument("--pages", type=int, default=2, help="Pages per category (default: 2)")
    parser.add_argument("--output", default="data/sephora_intelligence.json", help="Output JSON path")
    parser.add_argument("--category", default=None, help="Single category key to scrape")
    args = parser.parse_args()

    asyncio.run(run(args.pages, args.output, args.category))


if __name__ == "__main__":
    main()
