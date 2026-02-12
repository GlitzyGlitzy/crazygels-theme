from __future__ import annotations

"""
Sephora DE product scraper.

Scrapes product listings and detail pages from sephora.de, targeting
skincare, haircare, fragrance, and nail categories relevant to CrazyGels.

Uses a hybrid approach:
  1. Primary: Sephora DE's internal JSON catalog API for reliable product
     listings (no JS rendering needed, resilient to frontend changes).
  2. Fallback: Playwright-based browsing with updated category URLs and
     CSS selectors matching the current (Feb 2026) sephora.de frontend.

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

# ── Internal Catalog API ─────────────────────────────────────
# Sephora DE exposes a JSON catalog endpoint used by the SPA frontend.
# This is far more reliable than scraping rendered HTML.
CATALOG_API = "https://www.sephora.de/api/catalog/products"

# Category slug -> (API category_id / URL path, Category enum)
# Updated Feb 2026: Sephora DE restructured to German navigation paths.
# The API uses numeric category IDs; the URL paths are fallback for
# Playwright-based scraping.
CATEGORY_MAP = {
    "skincare_serums": {
        "search_term": "serum gesichtspflege",
        "url_path": "/gesicht/seren-essenzen/",
        "category": Category.SERUMS,
    },
    "skincare_moisturizers": {
        "search_term": "feuchtigkeitspflege gesichtscreme",
        "url_path": "/gesicht/feuchtigkeitspflege/",
        "category": Category.MOISTURIZERS,
    },
    "skincare_toners": {
        "search_term": "toner gesichtswasser",
        "url_path": "/gesicht/toner-gesichtswasser/",
        "category": Category.TONERS,
    },
    "skincare_masks": {
        "search_term": "gesichtsmaske skincare",
        "url_path": "/gesicht/masken/",
        "category": Category.FACE_MASKS,
    },
    "fragrances": {
        "search_term": "parfum eau de parfum",
        "url_path": "/parfum/",
        "category": Category.FRAGRANCES,
    },
    "haircare": {
        "search_term": "haarpflege",
        "url_path": "/haare/",
        "category": Category.HAIRCARE,
    },
    "haircare_shampoo": {
        "search_term": "shampoo haarpflege",
        "url_path": "/haare/shampoo/",
        "category": Category.SHAMPOO_CONDITIONER,
    },
    "nail_care": {
        "search_term": "nagellack nagelpflege",
        "url_path": "/makeup/naegel/",
        "category": Category.NAIL_CARE,
    },
}

# Default categories to scrape if none specified
DEFAULT_CATEGORIES = [
    "skincare_serums",
    "skincare_moisturizers",
    "skincare_toners",
    "fragrances",
    "haircare_shampoo",
]

# Products per page in Sephora's API / listing grid
_PAGE_SIZE = 60


class SephoraScraper(BaseScraper):
    """Scraper for sephora.de product pages.

    Uses a two-phase approach:
      Phase 1 (API): Try the internal catalog/search JSON API first.
      Phase 2 (Browser fallback): If the API fails, fall back to
        Playwright-rendered category pages.
    """

    def __init__(
        self,
        pages_per_category: int = 2,
        category_filter: Optional[str] = None,
        **kwargs,
    ):
        super().__init__(
            source=Source.SEPHORA,
            max_concurrent=2,
            request_delay=(3.0, 7.0),
            max_retries=3,
            timeout=60,
            **kwargs,
        )
        self.pages_per_category = pages_per_category
        self.category_filter = category_filter
        self._categories = (
            {category_filter: CATEGORY_MAP[category_filter]}
            if category_filter and category_filter in CATEGORY_MAP
            else {k: CATEGORY_MAP[k] for k in DEFAULT_CATEGORIES}
        )

    # ── Phase 1: API-based scraping ─────────────────────────────

    async def _fetch_api_products(self, search_term: str, category: Category, page: int = 1) -> list[Product]:
        """Fetch products from Sephora DE's internal search/catalog API."""
        products = []

        # Sephora DE search URL returns HTML with embedded product data
        # Use the search endpoint which is the most reliable way to get products
        search_url = f"{BASE_URL}/suche?q={search_term.replace(' ', '+')}&page={page}"

        logger.info(f"[sephora] API attempt: fetching search results for '{search_term}' page {page}")

        try:
            html = await self._fetch_js(
                search_url,
                wait_selector=".product-tile, [class*='ProductTile'], [class*='product-grid'], [class*='ProductGrid'], h3, .css-",
                timeout_ms=45000,
            )
            if not html:
                logger.warning(f"[sephora] No HTML from search for '{search_term}'")
                return products

            # Try to extract __NEXT_DATA__ or embedded JSON with product data
            soup = BeautifulSoup(html, "html.parser")

            # Method 1: Look for Next.js / React hydration data
            script_tags = soup.find_all("script", {"type": "application/json"})
            for script in script_tags:
                try:
                    data = json.loads(script.string)
                    extracted = self._extract_products_from_json(data, category)
                    if extracted:
                        products.extend(extracted)
                        logger.info(f"[sephora] Extracted {len(extracted)} products from JSON data")
                        return products
                except (json.JSONDecodeError, TypeError):
                    continue

            # Method 2: Look for __NEXT_DATA__ script
            next_data = soup.find("script", {"id": "__NEXT_DATA__"})
            if next_data and next_data.string:
                try:
                    data = json.loads(next_data.string)
                    extracted = self._extract_products_from_json(data, category)
                    if extracted:
                        products.extend(extracted)
                        logger.info(f"[sephora] Extracted {len(extracted)} from __NEXT_DATA__")
                        return products
                except (json.JSONDecodeError, TypeError):
                    pass

            # Method 3: Look for any inline script containing product arrays
            for script in soup.find_all("script"):
                if not script.string:
                    continue
                # Look for JSON arrays of products in script content
                json_matches = re.findall(r'\[{"(?:product_hash|sku|productId|id)"[^]]+\]', script.string)
                for match in json_matches:
                    try:
                        data = json.loads(match)
                        if isinstance(data, list) and len(data) > 0:
                            extracted = self._extract_products_from_json(data, category)
                            if extracted:
                                products.extend(extracted)
                                return products
                    except json.JSONDecodeError:
                        continue

            # Method 4: Fall back to HTML parsing of the search results page
            logger.info(f"[sephora] No embedded JSON found, parsing HTML for products")
            products = self._parse_product_tiles(soup, category)

        except Exception as e:
            logger.error(f"[sephora] API/search error for '{search_term}': {e}")

        return products

    def _extract_products_from_json(self, data: dict | list, category: Category) -> list[Product]:
        """Recursively search JSON data for product information."""
        products = []

        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    product = self._json_to_product(item, category)
                    if product:
                        products.append(product)
                    else:
                        # Recurse into nested structures
                        products.extend(self._extract_products_from_json(item, category))
            return products

        if not isinstance(data, dict):
            return products

        # Check if this dict itself is a product
        product = self._json_to_product(data, category)
        if product:
            products.append(product)
            return products

        # Look for common product list keys in Sephora's data structures
        product_keys = [
            "products", "items", "productsList", "results",
            "hits", "records", "searchResults", "productData",
            "props", "pageProps", "data", "content",
        ]
        for key in product_keys:
            if key in data:
                nested = data[key]
                if isinstance(nested, (list, dict)):
                    found = self._extract_products_from_json(nested, category)
                    if found:
                        products.extend(found)
                        return products

        return products

    def _json_to_product(self, data: dict, category: Category) -> Optional[Product]:
        """Try to convert a JSON dict into a Product model."""
        # Must have at minimum a name or display name
        name = (
            data.get("displayName")
            or data.get("productName")
            or data.get("name")
            or data.get("product_name")
            or data.get("title")
        )
        if not name or not isinstance(name, str) or len(name) < 3:
            return None

        # Must have some price indicator
        price_val = 0.0
        for price_key in ["currentPrice", "price", "listPrice", "salePrice", "displayPrice"]:
            raw = data.get(price_key)
            if raw is not None:
                if isinstance(raw, (int, float)):
                    price_val = float(raw)
                elif isinstance(raw, str):
                    price_val = _extract_price(raw)
                elif isinstance(raw, dict):
                    price_val = float(raw.get("amount", 0) or raw.get("value", 0) or 0)
                if price_val > 0:
                    break

        # Skip items that don't look like real products (no price, no brand)
        brand = (
            data.get("brandName")
            or data.get("brand")
            or data.get("brand_name")
            or "Unknown"
        )
        if isinstance(brand, dict):
            brand = brand.get("name", brand.get("displayName", "Unknown"))

        # External ID / SKU
        ext_id = str(
            data.get("productId")
            or data.get("sku")
            or data.get("skuId")
            or data.get("id")
            or hashlib.md5(name.encode()).hexdigest()[:16]
        )
        external_id = f"sephora_{ext_id}"

        # URL
        url_path = data.get("url") or data.get("productUrl") or data.get("targetUrl") or ""
        url = urljoin(BASE_URL, url_path) if url_path else f"{BASE_URL}/p/{ext_id}"

        # Image
        image_url = (
            data.get("heroImage")
            or data.get("imageUrl")
            or data.get("image")
            or data.get("primaryImage")
        )
        if isinstance(image_url, dict):
            image_url = image_url.get("url") or image_url.get("src")

        # Sale price
        sale_price = None
        for key in ["salePrice", "promoPrice", "discountPrice"]:
            raw = data.get(key)
            if raw is not None:
                sp = float(raw) if isinstance(raw, (int, float)) else _extract_price(str(raw))
                if 0 < sp < price_val:
                    sale_price = sp
                    break

        # Rating
        rating = None
        raw_rating = data.get("rating") or data.get("averageRating") or data.get("stars")
        if raw_rating is not None:
            try:
                rating = min(float(raw_rating), 5.0)
            except (ValueError, TypeError):
                pass

        # Review count
        review_count = None
        raw_reviews = data.get("reviewCount") or data.get("reviews") or data.get("totalReviews")
        if raw_reviews is not None:
            try:
                review_count = int(raw_reviews)
            except (ValueError, TypeError):
                pass

        # Description
        description = data.get("description") or data.get("shortDescription") or None
        if description and len(description) > 1000:
            description = description[:1000]

        # Size
        size = data.get("size") or data.get("displaySize") or None

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
                in_stock=data.get("inStock", True) if isinstance(data.get("inStock"), bool) else True,
            ),
            image_url=image_url,
            description=description,
            rating=rating,
            review_count=review_count,
            ingredients=data.get("ingredients"),
            size=size,
            sku=ext_id,
            tags=["sephora_de"],
        )

    def _parse_product_tiles(self, soup: BeautifulSoup, category: Category) -> list[Product]:
        """Parse product data directly from HTML product tiles on listing pages.

        This handles the current (Feb 2026) Sephora DE frontend where
        product tiles contain structured text with brand, name, price,
        reviews, and size information.
        """
        products = []

        # Sephora DE renders product tiles as blocks with:
        #   ### Product Name\n[BRAND]\nReviewCount\nPrice\nSize
        # Find all heading-level elements (h2, h3) that could be product titles
        product_headings = soup.find_all(["h2", "h3"])
        for heading in product_headings:
            try:
                name = heading.get_text(strip=True)
                if not name or len(name) < 3:
                    continue

                # Get the parent container that holds all product info
                parent = heading.find_parent(["div", "li", "article", "a"])
                if not parent:
                    continue

                full_text = parent.get_text(separator="\n", strip=True)
                lines = [l.strip() for l in full_text.split("\n") if l.strip()]

                # Skip non-product headings (navigation, marketing)
                if len(lines) < 3:
                    continue

                # Look for price pattern (e.g., "31,95 €" or "Ab 25,95 €*")
                price_val = 0.0
                for line in lines:
                    if "€" in line and not "/ 1" in line:  # Skip per-unit prices
                        price_val = _extract_price(line)
                        if price_val > 0:
                            break

                if price_val <= 0:
                    continue  # Not a product tile

                # Extract brand (usually in brackets or a separate element)
                brand = "Unknown"
                brand_el = parent.find("a") or parent.find(string=re.compile(r"^[A-Z][A-Z\s&'.]+$"))
                if brand_el:
                    brand_text = brand_el.get_text(strip=True) if hasattr(brand_el, 'get_text') else str(brand_el).strip()
                    if brand_text and brand_text.upper() == brand_text and len(brand_text) > 1:
                        brand = brand_text.title()

                # Extract review count from text like "5992" or "1421 Bewertungen"
                review_count = None
                for line in lines:
                    review_match = re.search(r"(\d+)\s*Bewertung", line)
                    if review_match:
                        review_count = int(review_match.group(1))
                        break
                    # Standalone number that could be review count
                    if re.match(r"^\d{2,}$", line) and int(line) < 100000:
                        review_count = int(line)

                # Extract size (e.g., "50 ml", "30 g")
                size = None
                for line in lines:
                    size_match = re.search(r"(\d+(?:[.,]\d+)?\s*(?:ml|g|oz|fl\s*oz))", line, re.I)
                    if size_match:
                        size = size_match.group(1)
                        break

                # Product URL from parent link
                url = ""
                link = parent.find("a", href=True) if parent.name != "a" else parent
                if link and link.get("href"):
                    url = urljoin(BASE_URL, link["href"])

                ext_id = hashlib.md5(f"{brand}:{name}".encode()).hexdigest()[:16]

                products.append(Product(
                    source=Source.SEPHORA,
                    external_id=f"sephora_{ext_id}",
                    name=name,
                    brand=brand,
                    url=url or f"{BASE_URL}/search?q={name.replace(' ', '+')}",
                    category=category,
                    price=PricePoint(price=price_val, currency="EUR", in_stock=True),
                    review_count=review_count,
                    size=size,
                    sku=ext_id,
                    tags=["sephora_de"],
                ))

            except Exception as e:
                logger.debug(f"[sephora] Error parsing product tile: {e}")
                continue

        return products

    # ── Phase 2: Browser-based fallback ─────────────────────────

    async def get_category_urls(self) -> list[str]:
        """Generate paginated category listing URLs (browser fallback)."""
        urls = []
        for cat_key, cat_info in self._categories.items():
            for page in range(1, self.pages_per_category + 1):
                path = cat_info["url_path"]
                separator = "&" if "?" in path else "?"
                url = f"{BASE_URL}{path}{separator}page={page}"
                urls.append(url)
        return urls

    async def parse_listing(self, html: str, url: str) -> list[str]:
        """Extract product detail page URLs from a category listing page."""
        soup = BeautifulSoup(html, "html.parser")
        product_urls = []

        # Updated selectors for Sephora DE (Feb 2026)
        # The site now uses React-based product grids with various class patterns
        selectors = [
            # Current Sephora DE product link patterns
            "a[href*='/p/']",
            "a[href*='/produkte/']",
            "a[href*='/product/']",
            # CSS module class patterns (Sephora uses hashed CSS classes)
            "a[class*='product']",
            "a[class*='ProductTile']",
            "a[class*='css-'][href]",
            # Data attribute patterns
            "a[data-comp='ProductTile']",
            "[data-testid='product-tile'] a",
            "[data-comp='ProductGrid'] a",
            # Generic grid item links
            ".product-tile a",
            ".product-grid a",
            ".product-list a",
        ]

        seen = set()
        for selector in selectors:
            try:
                links = soup.select(selector)
                for link in links:
                    href = link.get("href", "")
                    if not href or href == "#":
                        continue
                    full_url = urljoin(BASE_URL, href)
                    # Filter to actual product pages (exclude category/filter links)
                    parsed = urlparse(full_url)
                    if (
                        parsed.netloc.endswith("sephora.de")
                        and any(pattern in full_url for pattern in ["/p/", "/produkte/", "/product/"])
                        and full_url not in seen
                    ):
                        seen.add(full_url)
                        product_urls.append(full_url)
            except Exception:
                continue

        # Broader fallback: any sephora.de link that looks like a product page
        if not product_urls:
            for a in soup.find_all("a", href=True):
                href = a["href"]
                full_url = urljoin(BASE_URL, href)
                if (
                    re.search(r"/(?:p|produkte|product)/[^/?]+", full_url)
                    or re.search(r"-P\d{5,}", full_url)
                ):
                    if full_url not in seen:
                        seen.add(full_url)
                        product_urls.append(full_url)

        logger.info(f"[sephora] Found {len(product_urls)} product links on {url}")
        return product_urls

    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse a Sephora product detail page into a Product model."""
        soup = BeautifulSoup(html, "html.parser")

        try:
            # Try to extract from embedded JSON first (React hydration data)
            for script in soup.find_all("script", {"type": "application/json"}):
                try:
                    data = json.loads(script.string)
                    products = self._extract_products_from_json(data, _url_to_category(url))
                    if products:
                        return products[0]
                except (json.JSONDecodeError, TypeError):
                    continue

            next_data = soup.find("script", {"id": "__NEXT_DATA__"})
            if next_data and next_data.string:
                try:
                    data = json.loads(next_data.string)
                    products = self._extract_products_from_json(data, _url_to_category(url))
                    if products:
                        return products[0]
                except (json.JSONDecodeError, TypeError):
                    pass

            # Fall back to HTML parsing
            # Product name - try multiple selectors
            name_el = (
                soup.select_one("h1[data-comp='DisplayName']")
                or soup.select_one("h1.product-name")
                or soup.select_one("[data-testid='product-name']")
                or soup.select_one("h1 span")
                or soup.select_one("h1")
            )
            name = name_el.get_text(strip=True) if name_el else None
            if not name:
                return None

            # Brand
            brand_el = (
                soup.select_one("a[data-comp='BrandName']")
                or soup.select_one("[data-testid='brand-name']")
                or soup.select_one(".brand-name")
                or soup.select_one("a[href*='/marken/']")
                or soup.select_one("a[href*='/brand/']")
            )
            brand = brand_el.get_text(strip=True) if brand_el else "Unknown"

            # Price
            price_el = (
                soup.select_one("[data-comp='Price'] span")
                or soup.select_one("[data-testid='product-price']")
                or soup.select_one(".product-price")
                or soup.select_one(".price")
            )
            price_text = price_el.get_text(strip=True) if price_el else "0"
            price_val = _extract_price(price_text)

            # Sale price
            sale_el = soup.select_one(".sale-price, .price--sale, [data-comp='SalePrice'], [data-testid='sale-price']")
            sale_price = _extract_price(sale_el.get_text(strip=True)) if sale_el else None

            # Image
            img_el = (
                soup.select_one("img[data-comp='ProductImage']")
                or soup.select_one("[data-testid='product-image'] img")
                or soup.select_one(".product-image img")
                or soup.select_one("img.primary-image")
                or soup.select_one("picture img")
            )
            image_url = img_el.get("src") or img_el.get("data-src") if img_el else None

            # Description
            desc_el = (
                soup.select_one("[data-comp='ProductDescription']")
                or soup.select_one("[data-testid='product-description']")
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

            # Also try text-based review count extraction
            if not review_count:
                for el in soup.find_all(string=re.compile(r"\d+\s*Bewertung")):
                    m = re.search(r"(\d+)\s*Bewertung", el)
                    if m:
                        review_count = int(m.group(1))
                        break

            # Ingredients
            ingredients_el = (
                soup.select_one("#ingredients")
                or soup.select_one("[data-comp='Ingredients']")
                or soup.select_one("[data-testid='ingredients']")
                or soup.select_one(".ingredients-content")
            )
            ingredients = ingredients_el.get_text(strip=True)[:2000] if ingredients_el else None

            # Size
            size_el = (
                soup.select_one(".product-size")
                or soup.select_one("[data-comp='Size']")
                or soup.select_one("[data-testid='product-size']")
            )
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
        """Run the scrape with API-first strategy and browser fallback."""
        started_at = datetime.utcnow()
        products: list[Product] = []
        errors: list[str] = []
        total_pages = 0

        logger.info(f"[{self.source.value}] Starting scrape (hybrid API + browser mode)...")

        # ── Phase 1: Try search-based approach (most resilient) ──
        for cat_key, cat_info in self._categories.items():
            search_term = cat_info["search_term"]
            category = cat_info["category"]

            for page in range(1, self.pages_per_category + 1):
                logger.info(
                    f"[{self.source.value}] Searching '{search_term}' page {page}/{self.pages_per_category}"
                )
                try:
                    page_products = await self._fetch_api_products(search_term, category, page)
                    if page_products:
                        products.extend(page_products)
                        total_pages += 1
                        logger.info(
                            f"[{self.source.value}]   -> Got {len(page_products)} products from search"
                        )
                    else:
                        logger.warning(f"[{self.source.value}]   -> No products from search, trying category URL fallback")
                        # Fallback to category URL
                        path = cat_info["url_path"]
                        separator = "&" if "?" in path else "?"
                        cat_url = f"{BASE_URL}{path}{separator}page={page}"
                        html = await self._fetch_js(
                            cat_url,
                            wait_selector="h2, h3, .product-tile, [class*='product'], [class*='Product']",
                            timeout_ms=60000,
                        )
                        if html:
                            total_pages += 1
                            # Save debug HTML on first empty result
                            os.makedirs("data", exist_ok=True)
                            debug_path = f"data/_debug_{cat_key}_p{page}.html"
                            with open(debug_path, "w") as f:
                                f.write(html)
                            logger.info(f"[{self.source.value}]   Saved debug HTML to {debug_path} ({len(html)} chars)")

                            # Try parsing product tiles from the HTML
                            soup = BeautifulSoup(html, "html.parser")
                            tile_products = self._parse_product_tiles(soup, category)
                            if tile_products:
                                products.extend(tile_products)
                                logger.info(
                                    f"[{self.source.value}]   -> Got {len(tile_products)} from HTML tiles"
                                )
                            else:
                                # Try finding product links for individual scraping
                                urls = await self.parse_listing(html, cat_url)
                                if urls:
                                    logger.info(
                                        f"[{self.source.value}]   -> Found {len(urls)} product URLs, scraping individually"
                                    )
                                    for purl in urls[:20]:  # Cap at 20 per category page
                                        phtml = await self._fetch_js(
                                            purl,
                                            wait_selector="h1, .product-name, [data-testid='product-name']",
                                            timeout_ms=45000,
                                        )
                                        if phtml:
                                            product = await self.parse_product(phtml, purl)
                                            if product:
                                                products.append(product)
                                else:
                                    errors.append(f"No products found for {cat_key} page {page}")
                        else:
                            errors.append(f"No HTML returned for {cat_key} category URL")

                except Exception as e:
                    errors.append(f"Error scraping {cat_key} page {page}: {e}")
                    logger.error(f"[{self.source.value}] Error: {e}")

        # Deduplicate by external_id
        seen_ids = set()
        unique_products = []
        for p in products:
            if p.external_id not in seen_ids:
                seen_ids.add(p.external_id)
                unique_products.append(p)
        products = unique_products

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

    # Pattern: skuId in query params
    parsed = urlparse(url)
    qs = parse_qs(parsed.query)
    sku = qs.get("skuId", [None])[0]
    if sku:
        return f"sephora_{sku}"

    return None


def _url_to_category(url: str) -> Category:
    """Determine product category from URL path."""
    path = urlparse(url).path.lower()
    if "seren" in path or "serum" in path:
        return Category.SERUMS
    if "feuchtigkeitspflege" in path or "moisturiz" in path or "creme" in path:
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
        "tranexamic": "tranexamic_acid",
    }

    for keyword, active_name in active_keywords.items():
        if keyword in text_lower:
            actives.append(active_name)

    notable_keywords = ["fragrance", "alcohol denat", "essential oil", "parfum", "duftstoff"]
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
