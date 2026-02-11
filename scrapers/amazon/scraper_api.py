"""
Amazon DE product scraper.

Scrapes product listings and detail pages from amazon.de, targeting
skincare, haircare, fragrance, and beauty categories.

Uses Playwright (via _fetch_js) since Amazon has aggressive anti-bot
detection and requires JS rendering for complete product data.

Usage:
    python scrapers/amazon/scraper_api.py --pages 2 --output data/amazon_intelligence.json
    python scrapers/amazon/scraper_api.py --pages 1 --category skincare_serums
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
from urllib.parse import urljoin, urlparse, parse_qs, urlencode

from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scrapers.common.base import BaseScraper
from scrapers.common.models import Product, PricePoint, ScraperResult, Source, Category

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

BASE_URL = "https://www.amazon.de"

# Category slug -> (search/browse URL path, Category enum)
# Using Best Sellers and search-based navigation for resilience
CATEGORY_MAP = {
    "skincare_serums": ("/s?k=gesichtsserum&rh=n%3A84231031", Category.SERUMS),
    "skincare_moisturizers": ("/s?k=gesichtscreme+feuchtigkeitspflege&rh=n%3A84231031", Category.MOISTURIZERS),
    "skincare_toners": ("/s?k=gesichtswasser+toner&rh=n%3A84231031", Category.TONERS),
    "skincare_masks": ("/s?k=gesichtsmaske+skincare&rh=n%3A84231031", Category.FACE_MASKS),
    "fragrances": ("/s?k=parfum+damen+herren&rh=n%3A64270031", Category.FRAGRANCES),
    "haircare_shampoo": ("/s?k=shampoo&rh=n%3A84233031", Category.SHAMPOO_CONDITIONER),
    "haircare": ("/s?k=haarpflege&rh=n%3A84233031", Category.HAIRCARE),
    "nail_care": ("/s?k=nagellack+nagelpflege&rh=n%3A84249031", Category.NAIL_CARE),
}

DEFAULT_CATEGORIES = [
    "skincare_serums",
    "skincare_moisturizers",
    "fragrances",
    "haircare_shampoo",
]


class AmazonScraper(BaseScraper):
    """Scraper for amazon.de product pages."""

    def __init__(
        self,
        pages_per_category: int = 2,
        category_filter: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            source=Source.AMAZON,
            max_concurrent=2,
            request_delay=(3.0, 7.0),  # Slower to avoid aggressive bot detection
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
        """Generate paginated Amazon search result URLs."""
        urls = []
        for cat_key, (path, _) in self._categories.items():
            for page in range(1, self.pages_per_category + 1):
                separator = "&" if "?" in path else "?"
                url = f"{BASE_URL}{path}{separator}page={page}"
                urls.append(url)
        return urls

    async def parse_listing(self, html: str, url: str) -> list[str]:
        """Extract product detail page URLs from Amazon search results."""
        soup = BeautifulSoup(html, "html.parser")
        product_urls = []
        seen = set()

        # Amazon search result selectors
        selectors = [
            "div[data-component-type='s-search-result'] a.a-link-normal[href*='/dp/']",
            ".s-result-item a.a-link-normal[href*='/dp/']",
            "h2 a.a-link-normal[href*='/dp/']",
            "a[href*='/dp/'][class*='a-link-normal']",
        ]

        for selector in selectors:
            links = soup.select(selector)
            for link in links:
                href = link.get("href", "")
                if not href:
                    continue
                full_url = urljoin(BASE_URL, href)
                # Clean URL to just the product page (remove tracking params)
                clean_url = _clean_amazon_url(full_url)
                if clean_url and clean_url not in seen:
                    seen.add(clean_url)
                    product_urls.append(clean_url)

        # Fallback: find any /dp/ links
        if not product_urls:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                if "/dp/" in href:
                    full_url = urljoin(BASE_URL, href)
                    clean_url = _clean_amazon_url(full_url)
                    if clean_url and clean_url not in seen:
                        seen.add(clean_url)
                        product_urls.append(clean_url)

        logger.info(f"[amazon] Found {len(product_urls)} product links on {url}")
        return product_urls

    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse an Amazon product detail page into a Product model."""
        soup = BeautifulSoup(html, "html.parser")

        try:
            # Product name
            name_el = (
                soup.select_one("#productTitle")
                or soup.select_one("h1.product-title-word-break")
                or soup.select_one("h1 span")
            )
            name = name_el.get_text(strip=True) if name_el else None
            if not name:
                return None

            # Brand
            brand_el = (
                soup.select_one("#bylineInfo")
                or soup.select_one("a#bylineInfo")
                or soup.select_one(".po-brand .po-break-word")
            )
            brand = "Unknown"
            if brand_el:
                brand_text = brand_el.get_text(strip=True)
                # Remove "Marke: " or "Brand: " prefix
                brand = re.sub(r"^(Marke:|Brand:|Besuche den |Visit the )\s*", "", brand_text).strip()
                # Remove "-Store" suffix
                brand = re.sub(r"\s*-?Store$", "", brand).strip()

            # Price
            price_el = (
                soup.select_one(".a-price .a-offscreen")
                or soup.select_one("#priceblock_ourprice")
                or soup.select_one("#priceblock_dealprice")
                or soup.select_one(".a-price-whole")
            )
            price_text = price_el.get_text(strip=True) if price_el else "0"
            price_val = _extract_price(price_text)

            # Original price (if on sale)
            original_el = (
                soup.select_one(".a-price[data-a-strike='true'] .a-offscreen")
                or soup.select_one(".priceBlockStrikePriceString")
            )
            sale_price = None
            if original_el:
                original_price = _extract_price(original_el.get_text(strip=True))
                if original_price > price_val:
                    sale_price = price_val
                    price_val = original_price

            # Image
            img_el = (
                soup.select_one("#imgTagWrapperId img")
                or soup.select_one("#landingImage")
                or soup.select_one("#main-image")
            )
            image_url = None
            if img_el:
                # Prefer data-old-hires for high-res, fall back to src
                image_url = (
                    img_el.get("data-old-hires")
                    or img_el.get("src")
                    or img_el.get("data-a-dynamic-image", "")
                )
                if image_url and image_url.startswith("{"):
                    # data-a-dynamic-image is JSON -- extract first URL
                    try:
                        urls = json.loads(image_url)
                        image_url = next(iter(urls.keys()), None)
                    except (json.JSONDecodeError, StopIteration):
                        image_url = None

            # Description
            desc_el = (
                soup.select_one("#productDescription")
                or soup.select_one("#feature-bullets")
            )
            description = desc_el.get_text(strip=True)[:1000] if desc_el else None

            # Rating
            rating_el = soup.select_one("#acrPopover") or soup.select_one(".a-icon-star span")
            rating = None
            if rating_el:
                rating_text = rating_el.get("title", "") or rating_el.get_text(strip=True)
                rating_match = re.search(r"([\d,]+)\s*(?:von|out of)\s*5", rating_text)
                if rating_match:
                    rating = min(float(rating_match.group(1).replace(",", ".")), 5.0)

            # Review count
            review_el = soup.select_one("#acrCustomerReviewText")
            review_count = None
            if review_el:
                count_match = re.search(r"([\d.]+)", review_el.get_text().replace(".", ""))
                if count_match:
                    review_count = int(count_match.group(1))

            # Ingredients
            ingredients = None
            # Check product details table
            for row in soup.select("#productDetails_techSpec_section_1 tr, .content-grid-block tr"):
                header = row.select_one("th, td:first-child")
                if header and re.search(r"inhaltsstoffe|ingredients", header.get_text(), re.I):
                    value = row.select_one("td:last-child, td:nth-child(2)")
                    if value:
                        ingredients = value.get_text(strip=True)[:2000]
                        break

            # Also check "Important information" section
            if not ingredients:
                important_el = soup.select_one("#important-information .content")
                if important_el:
                    text = important_el.get_text(strip=True)
                    if len(text) > 50:  # Likely ingredients list
                        ingredients = text[:2000]

            # Size
            size = None
            for row in soup.select(".po-size .po-break-word, #productDetails_techSpec_section_1 tr"):
                text = row.get_text(strip=True)
                size_match = re.search(r"(\d+\s*(?:ml|g|oz|fl))", text, re.I)
                if size_match:
                    size = size_match.group(1)
                    break

            # ASIN from URL
            asin = _extract_asin(url)
            external_id = f"amazon_{asin}" if asin else hashlib.md5(url.encode()).hexdigest()[:16]

            # Availability
            avail_el = soup.select_one("#availability span")
            in_stock = True
            if avail_el:
                avail_text = avail_el.get_text(strip=True).lower()
                if "nicht verfügbar" in avail_text or "not available" in avail_text:
                    in_stock = False

            # Determine category from URL context
            category = _url_to_category(url, name)

            return Product(
                source=Source.AMAZON,
                external_id=external_id,
                name=name,
                brand=brand,
                url=url,
                category=category,
                price=PricePoint(
                    price=price_val,
                    currency="EUR",
                    sale_price=sale_price,
                    in_stock=in_stock,
                ),
                image_url=image_url,
                description=description,
                rating=rating,
                review_count=review_count,
                ingredients=ingredients,
                size=size,
                sku=asin,
                tags=["amazon_de"],
            )

        except Exception as e:
            logger.error(f"[amazon] Failed to parse product from {url}: {e}")
            return None

    async def scrape(self) -> ScraperResult:
        """Override to use _fetch_js for Amazon's JS-heavy pages."""
        started_at = datetime.utcnow()
        products: list[Product] = []
        errors: list[str] = []
        total_pages = 0

        logger.info(f"[{self.source.value}] Starting scrape (JS mode)...")

        category_urls = await self.get_category_urls()
        product_urls: list[str] = []

        # Phase 1: Collect product URLs from search result pages
        for cat_url in category_urls:
            html = await self._fetch_js(
                cat_url,
                wait_selector=".s-result-item, [data-component-type='s-search-result']",
            )
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
            html = await self._fetch_js(url, wait_selector="#productTitle, #dp")
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
    cleaned = re.sub(r"[^\d,.]", "", text)
    cleaned = cleaned.replace(",", ".")
    parts = cleaned.rsplit(".", 1)
    if len(parts) == 2:
        cleaned = parts[0].replace(".", "") + "." + parts[1]
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def _extract_asin(url: str) -> Optional[str]:
    """Extract ASIN from Amazon URL (the /dp/ASIN part)."""
    match = re.search(r"/dp/([A-Z0-9]{10})", url)
    return match.group(1) if match else None


def _clean_amazon_url(url: str) -> Optional[str]:
    """Clean Amazon URL to canonical product page form."""
    asin = _extract_asin(url)
    if asin:
        return f"{BASE_URL}/dp/{asin}"
    return None


def _url_to_category(url: str, name: str = "") -> Category:
    """Determine product category from URL and product name context."""
    combined = (url + " " + name).lower()
    if "serum" in combined:
        return Category.SERUMS
    if "creme" in combined or "moisturiz" in combined or "feuchtigk" in combined:
        return Category.MOISTURIZERS
    if "toner" in combined or "gesichtswasser" in combined:
        return Category.TONERS
    if "maske" in combined or "mask" in combined:
        return Category.FACE_MASKS
    if "parfum" in combined or "fragrance" in combined or "eau de" in combined:
        return Category.FRAGRANCES
    if "shampoo" in combined or "conditioner" in combined:
        return Category.SHAMPOO_CONDITIONER
    if "haar" in combined or "hair" in combined:
        return Category.HAIRCARE
    if "nagel" in combined or "nail" in combined:
        return Category.NAIL_CARE
    return Category.SKINCARE


def _anonymise_product(product: Product) -> dict:
    """Convert a Product to an anonymised intelligence dict."""
    hash_input = f"{product.source.value}:{product.external_id}:{product.name}"
    product_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    # EUR price tiers
    price = product.price.price
    if price > 100:
        price_tier = "luxury"
    elif price > 50:
        price_tier = "premium"
    elif price > 15:
        price_tier = "mid"
    else:
        price_tier = "budget"

    # Brand tier
    premium_brands = {"la roche-posay", "vichy", "cerave", "neutrogena", "paula's choice"}
    brand_lower = product.brand.lower()
    if price > 80:
        brand_type = "premium"
    elif brand_lower in premium_brands or price > 30:
        brand_type = "mid_range"
    else:
        brand_type = "mass_market"

    return {
        "product_hash": product_hash,
        "source": "amazon_de",
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
        "hyaluronsäure": "hyaluronic_acid",
        "salicylic acid": "salicylic_acid",
        "salicylsäure": "salicylic_acid",
        "glycolic acid": "glycolic_acid",
        "lactic acid": "lactic_acid",
        "vitamin c": "vitamin_c",
        "ascorbic acid": "vitamin_c",
        "ascorbinsäure": "vitamin_c",
        "azelaic acid": "azelaic_acid",
        "ceramide": "ceramide",
        "peptide": "peptide",
        "squalane": "squalane",
        "centella": "centella",
        "bakuchiol": "bakuchiol",
        "zink": "zinc",
    }

    for keyword, active_name in active_keywords.items():
        if keyword in text_lower:
            actives.append(active_name)

    for keyword in ["fragrance", "alcohol denat", "parfum", "duftstoff"]:
        if keyword in text_lower:
            notable.append(keyword.replace(" ", "_"))

    return {"actives": actives, "notable": notable}


# ── CLI entrypoint ───────────────────────────────────────────

async def run(pages: int, output: str, category: Optional[str] = None):
    """Run the Amazon scraper and write results to JSON."""
    scraper = AmazonScraper(pages_per_category=pages, category_filter=category)
    async with scraper:
        result = await scraper.scrape()

    anonymised = [_anonymise_product(p) for p in result.products]

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, "w") as f:
        json.dump(anonymised, f, indent=2, ensure_ascii=False)

    logger.info(f"Wrote {len(anonymised)} anonymised products to {output}")
    return len(anonymised)


def main():
    parser = argparse.ArgumentParser(description="Amazon DE product scraper")
    parser.add_argument("--pages", type=int, default=2, help="Pages per category (default: 2)")
    parser.add_argument("--output", default="data/amazon_intelligence.json", help="Output JSON path")
    parser.add_argument("--category", default=None, help="Single category key to scrape")
    args = parser.parse_args()

    asyncio.run(run(args.pages, args.output, args.category))


if __name__ == "__main__":
    main()
