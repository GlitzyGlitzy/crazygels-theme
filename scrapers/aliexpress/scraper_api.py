"""
AliExpress product scraper following the luminati-io / Bright Data open-source pattern.

Targets nail gel, UV gel, builder gel, and beauty products on AliExpress.
Uses Playwright (_fetch_js) for JS-rendered content and extracts structured
data from window.runParams / window.pageConfig JSON embedded in each page.

Reference: https://github.com/luminati-io/AliExpress-Scraper

Usage:
    # By category (default)
    python scrapers/aliexpress/scraper_api.py --pages 2
    python scrapers/aliexpress/scraper_api.py --pages 1 --category nail_gel

    # By brand name (one or more, comma-separated)
    python scrapers/aliexpress/scraper_api.py --brand "Makartt"
    python scrapers/aliexpress/scraper_api.py --brand "Makartt,Beetles,Modelones" --pages 2

    # Brand + category combined (narrows search to brand's products in that category)
    python scrapers/aliexpress/scraper_api.py --brand "Makartt" --category nail_gel
"""

from __future__ import annotations

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
from urllib.parse import urlencode, urljoin, urlparse

from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from scrapers.common.base import BaseScraper
from scrapers.common.models import Category, PricePoint, Product, ScraperResult, Source

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

BASE_URL = "https://www.aliexpress.com"
SEARCH_URL = f"{BASE_URL}/wholesale"

USD_TO_EUR = 0.92

# Search term -> (query string, Category enum)
# Focused on CrazyGels' core nail gel business first, supporting beauty second.
CATEGORY_MAP: dict[str, tuple[str, Category]] = {
    "nail_gel": ("nail gel uv builder soak off", Category.NAIL_CARE),
    "nail_polish": ("nail polish gel led lamp", Category.NAIL_CARE),
    "nail_art": ("nail art decoration glitter stamping", Category.NAIL_CARE),
    "nail_tools": ("nail drill machine uv gel lamp tools", Category.NAIL_CARE),
    "skincare_serums": ("face serum vitamin c niacinamide hyaluronic", Category.SERUMS),
    "skincare_moisturizers": ("face cream moisturizer korean skincare", Category.MOISTURIZERS),
    "haircare": ("hair care serum growth oil treatment", Category.HAIRCARE),
}

DEFAULT_CATEGORIES = ["nail_gel", "nail_polish", "nail_art", "nail_tools"]


class AliExpressScraper(BaseScraper):
    """
    Scraper for AliExpress product pages.

    Follows the luminati-io / Bright Data pattern:
    1. Paginated wholesale search pages -> collect item IDs
    2. Product detail pages -> extract window.runParams JSON for structured data
    3. HTML BeautifulSoup fallback when the embedded JSON isn't available

    Supports two search modes:
    - Category mode (default): searches predefined keyword groups (nail_gel, etc.)
    - Brand mode (--brand): searches by exact brand/store name, optionally narrowed
      by --category to add category keywords to the query.
    """

    def __init__(
        self,
        pages_per_category: int = 2,
        category_filter: Optional[str] = None,
        brand_filter: Optional[list[str]] = None,
        min_seller_feedback: float = 98.0,
        min_store_age_days: int = 365,
        **kwargs,
    ):
        super().__init__(
            source=Source.ALIEXPRESS,
            max_concurrent=2,
            request_delay=(4.0, 9.0),  # AliExpress has aggressive bot detection
            max_retries=3,
            timeout=60,
            **kwargs,
        )
        self.pages_per_category = pages_per_category
        self.category_filter = category_filter
        self.brand_filter = [b.strip() for b in brand_filter] if brand_filter else []
        self.min_seller_feedback = min_seller_feedback
        self.min_store_age_days = min_store_age_days

        self._categories = (
            {category_filter: CATEGORY_MAP[category_filter]}
            if category_filter and category_filter in CATEGORY_MAP
            else {k: CATEGORY_MAP[k] for k in DEFAULT_CATEGORIES}
        )

    def _build_search_queries(self) -> list[tuple[str, str, Category]]:
        """
        Return a list of (label, search_text, category) tuples to scrape.

        Brand mode: one entry per brand (optionally combined with category keywords).
        Category mode: one entry per category.
        """
        queries: list[tuple[str, str, Category]] = []

        if self.brand_filter:
            # Brand mode — search each brand, optionally narrowed by category keywords
            if self.category_filter and self.category_filter in CATEGORY_MAP:
                cat_query, cat_enum = CATEGORY_MAP[self.category_filter]
                for brand in self.brand_filter:
                    # Combine brand name with category keywords for a focused search
                    combined = f"{brand} {cat_query}"
                    queries.append((f"brand:{brand}+{self.category_filter}", combined, cat_enum))
            else:
                for brand in self.brand_filter:
                    queries.append((f"brand:{brand}", brand, Category.NAIL_CARE))
        else:
            # Category mode (default)
            for cat_key, (query, cat_enum) in self._categories.items():
                queries.append((cat_key, query, cat_enum))

        return queries

    async def get_category_urls(self) -> list[str]:
        """Build paginated AliExpress search URLs."""
        urls = []
        for _label, query, _cat in self._build_search_queries():
            for page in range(1, self.pages_per_category + 1):
                params = urlencode({"SearchText": query, "page": page, "sortType": "default"})
                urls.append(f"{SEARCH_URL}?{params}")
        return urls

    async def parse_listing(self, html: str, url: str) -> list[str]:
        """
        Extract product detail page URLs from an AliExpress search results page.

        AliExpress embeds product IDs in several places; we try the window.runParams
        JSON first (most reliable), then fall back to href scanning.
        """
        product_urls: list[str] = []
        seen: set[str] = set()

        # 1. Try window._dida_config_ or window.runParams embedded JSON
        for pattern in [
            r'window\.__INITIAL_DATA__\s*=\s*(\{.*?\});',
            r'"items"\s*:\s*(\[.*?\])',
            r'window\.runParams\s*=\s*(\{.*?\})\s*;',
        ]:
            match = re.search(pattern, html, re.DOTALL)
            if match:
                try:
                    data = json.loads(match.group(1))
                    items = data if isinstance(data, list) else _dig(data, "items", "resultList", "mods")
                    if isinstance(items, list):
                        for item in items:
                            item_id = _extract_item_id(item)
                            if item_id and item_id not in seen:
                                seen.add(item_id)
                                product_urls.append(f"{BASE_URL}/item/{item_id}.html")
                except (json.JSONDecodeError, TypeError):
                    pass

        # 2. HTML fallback -- scan <a> tags for /item/ links
        if not product_urls:
            soup = BeautifulSoup(html, "html.parser")
            for a in soup.find_all("a", href=True):
                href = a["href"]
                item_id = _item_id_from_url(href)
                if item_id and item_id not in seen:
                    seen.add(item_id)
                    product_urls.append(f"{BASE_URL}/item/{item_id}.html")

        logger.info(f"[aliexpress] Found {len(product_urls)} product links on {url}")
        return product_urls

    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """
        Parse an AliExpress product detail page.

        Primary path: extract window.runParams JSON (luminati-io pattern) which
        contains structured pricing, title, seller, and specs — including the
        seller feedback rate and store open date used for quality filtering.

        HTML fallback: skipped entirely when quality filters are active, because
        seller metrics cannot be reliably extracted from the rendered HTML.
        """
        try:
            run_params = _extract_run_params(html)
            if run_params:
                return _parse_from_run_params(
                    run_params,
                    url,
                    min_feedback=self.min_seller_feedback,
                    min_age_days=self.min_store_age_days,
                )

            # HTML fallback: seller quality cannot be verified — skip if filters are on
            if self.min_seller_feedback > 0 or self.min_store_age_days > 0:
                logger.debug(f"[aliexpress] Skipping {url} — no runParams, seller quality unverifiable")
                return None

            return _parse_from_html(html, url)

        except Exception as e:
            logger.error(f"[aliexpress] Failed to parse product {url}: {e}")
            return None

    async def scrape(self) -> ScraperResult:
        """Override to use _fetch_js for AliExpress JS-rendered pages."""
        started_at = datetime.utcnow()
        products: list[Product] = []
        errors: list[str] = []
        total_pages = 0

        queries = self._build_search_queries()
        if self.brand_filter:
            logger.info(f"[aliexpress] Starting brand scrape — brands: {self.brand_filter}")
        else:
            logger.info(f"[aliexpress] Starting category scrape — {[q[0] for q in queries]}")

        # Phase 1: collect product URLs from search pages, tracking which brand each came from
        url_to_label: dict[str, str] = {}
        for label, query, _cat in queries:
            for page in range(1, self.pages_per_category + 1):
                params = urlencode({"SearchText": query, "page": page, "sortType": "default"})
                cat_url = f"{SEARCH_URL}?{params}"
                html = await self._fetch_js(
                    cat_url,
                    wait_selector=".list--gallery--C2f2tvm, [class*='product-item'], [class*='SearchResult']",
                    timeout_ms=60000,
                )
                if html:
                    total_pages += 1
                    try:
                        found = await self.parse_listing(html, cat_url)
                        for u in found:
                            if u not in url_to_label:
                                url_to_label[u] = label
                    except Exception as e:
                        errors.append(f"Listing parse error ({cat_url}): {e}")

        logger.info(f"[aliexpress] Found {len(url_to_label)} unique product URLs")

        # Phase 2: scrape individual product pages
        for url, label in url_to_label.items():
            html = await self._fetch_js(
                url,
                wait_selector="[class*='product-title'], #product-title, .product-title-text",
                timeout_ms=60000,
            )
            if html:
                total_pages += 1
                try:
                    product = await self.parse_product(html, url)
                    if product:
                        # Tag with the brand or category label so outputs are traceable
                        if label.startswith("brand:"):
                            product.tags = list({*product.tags, label})
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
            f"[aliexpress] Scrape complete: "
            f"{len(products)} products, {len(errors)} errors, "
            f"{result.duration_seconds:.1f}s"
        )
        return result


# ── Embedded JSON extraction (luminati-io pattern) ───────────────────────────

def _extract_run_params(html: str) -> Optional[dict]:
    """
    Extract the window.runParams object AliExpress embeds in every product page.
    This contains structured product data: title, price, seller, specs, images.
    """
    patterns = [
        r'window\.runParams\s*=\s*(\{.+?\})\s*;\s*(?:window|var|let|const)',
        r'data\s*:\s*(\{"pageModule":\{.+?\})\s*,\s*"csrfToken"',
        r'"skuModule":\{.*?"productSKUPropertyList":\[',  # presence check only
    ]
    for pattern in patterns[:2]:
        match = re.search(pattern, html, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                pass

    # Deep search: find any JSON blob that contains titleModule
    match = re.search(r'\{"titleModule":\{.+?\}(?:,"[a-z]+Module"|\})', html, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    return None


def _parse_seller_feedback(store_mod: dict) -> Optional[float]:
    """
    Parse the seller positive feedback rate from storeModule.
    AliExpress returns it as a string like "98.5%" or a float like 98.5.
    Returns the rate as a float (0–100), or None if not present.
    """
    raw = store_mod.get("positiveRate") or store_mod.get("sellerPositiveFeedback")
    if raw is None:
        return None
    try:
        return float(str(raw).replace("%", "").strip())
    except (ValueError, TypeError):
        return None


def _parse_store_age_days(store_mod: dict) -> Optional[int]:
    """
    Parse the store open date from storeModule and return days since opening.
    AliExpress uses several formats for openTime:
      - "Jun 15, 2019"  (most common)
      - "2019-06-15"
      - Unix timestamp in milliseconds (integer)
    Returns None if the field is absent or unparseable.
    """
    raw = store_mod.get("openTime") or store_mod.get("openDate")
    if not raw:
        return None

    # Millisecond Unix timestamp
    if isinstance(raw, (int, float)):
        open_dt = datetime.utcfromtimestamp(raw / 1000)
        return (datetime.utcnow() - open_dt).days

    raw_str = str(raw).strip()

    # Try common string formats
    for fmt in ("%b %d, %Y", "%Y-%m-%d", "%d %b %Y", "%B %d, %Y"):
        try:
            open_dt = datetime.strptime(raw_str, fmt)
            return (datetime.utcnow() - open_dt).days
        except ValueError:
            continue

    # Relative strings like "2 years" — convert to approximate days
    match = re.search(r"(\d+)\s+year", raw_str, re.I)
    if match:
        return int(match.group(1)) * 365

    return None


def _check_seller_quality(
    store_mod: dict,
    min_feedback: float,
    min_age_days: int,
) -> tuple[bool, str]:
    """
    Check whether a seller meets quality thresholds.
    Returns (passes: bool, reason: str).
    """
    feedback = _parse_seller_feedback(store_mod)
    age_days = _parse_store_age_days(store_mod)
    store_name = store_mod.get("storeName", "unknown")

    if feedback is None and age_days is None:
        # storeModule present but no quality fields — treat as unknown, let through
        return True, "seller data unavailable (assumed OK)"

    if feedback is not None and feedback < min_feedback:
        return False, (
            f"seller '{store_name}' feedback {feedback:.1f}% < required {min_feedback:.0f}%"
        )

    if age_days is not None and age_days < min_age_days:
        years = age_days / 365
        return False, (
            f"store '{store_name}' is {years:.1f} years old < required {min_age_days / 365:.0f} year(s)"
        )

    return True, f"seller '{store_name}' OK (feedback={feedback}, age={age_days}d)"


def _parse_from_run_params(
    data: dict,
    url: str,
    min_feedback: float = 98.0,
    min_age_days: int = 365,
) -> Optional[Product]:
    """Parse a Product from AliExpress window.runParams structured data."""
    title_mod = _dig(data, "titleModule") or {}
    price_mod = _dig(data, "priceModule") or {}
    image_mod = _dig(data, "imageModule") or {}
    store_mod = _dig(data, "storeModule") or {}
    spec_mod = _dig(data, "specsModule") or {}
    feedback_mod = _dig(data, "feedbackModule") or {}

    name = title_mod.get("subject", "").strip()
    if not name:
        return None

    # Seller quality gate
    passes, reason = _check_seller_quality(store_mod, min_feedback, min_age_days)
    if not passes:
        logger.info(f"[aliexpress] FILTERED — {reason} — {url}")
        return None
    logger.debug(f"[aliexpress] PASSED quality check — {reason}")

    # Price — AliExpress shows USD, convert to EUR
    min_price = float(price_mod.get("minAmount", {}).get("value", 0) or 0)
    max_price = float(price_mod.get("maxAmount", {}).get("value", min_price) or min_price)
    price_usd = (min_price + max_price) / 2 if max_price > min_price else min_price
    price_eur = round(price_usd * USD_TO_EUR, 2)

    # Sale price
    orig_price_obj = price_mod.get("originalMaxAmount") or price_mod.get("originalMinAmount") or {}
    orig_usd = float(orig_price_obj.get("value", 0) or 0)
    sale_price = round(price_eur, 2) if orig_usd > price_usd else None
    if sale_price:
        price_eur = round(orig_usd * USD_TO_EUR, 2)

    # Image
    images = image_mod.get("imagePathList", [])
    image_url = f"https:{images[0]}" if images else None
    if image_url and image_url.startswith("https:https:"):
        image_url = image_url[6:]

    # Seller as brand
    brand = store_mod.get("storeName", "").strip() or "Unknown"

    # Specs -> description
    props = spec_mod.get("props", [])
    spec_lines = [f"{p.get('attrName', '')}: {p.get('attrValue', '')}" for p in props if p.get("attrName")]
    description = "; ".join(spec_lines)[:1000] if spec_lines else None

    # Rating / review count
    rating_str = feedback_mod.get("evarageStar", "0")
    try:
        rating = min(float(rating_str), 5.0)
    except (ValueError, TypeError):
        rating = None

    review_count_str = feedback_mod.get("totalValidNum", "0")
    try:
        review_count = int(re.sub(r"[^\d]", "", str(review_count_str)) or 0)
    except ValueError:
        review_count = None

    item_id = _item_id_from_url(url)
    external_id = f"aliexpress_{item_id}" if item_id else hashlib.md5(url.encode()).hexdigest()[:16]
    category = _infer_category(name, url)

    # Seller quality metadata on tags for traceability
    feedback = _parse_seller_feedback(store_mod)
    quality_tags = [f"seller_feedback_{int(feedback)}pct"] if feedback else []

    return Product(
        source=Source.ALIEXPRESS,
        external_id=external_id,
        name=name,
        brand=brand,
        url=url,
        category=category,
        price=PricePoint(
            price=price_eur,
            currency="EUR",
            sale_price=sale_price,
            in_stock=True,
        ),
        image_url=image_url,
        description=description,
        rating=rating,
        review_count=review_count,
        tags=["aliexpress", *quality_tags],
    )


def _parse_from_html(html: str, url: str) -> Optional[Product]:
    """HTML fallback parser for AliExpress product pages."""
    soup = BeautifulSoup(html, "html.parser")

    # Title
    name_el = (
        soup.select_one("h1.product-title-text")
        or soup.select_one("[class*='product-title']")
        or soup.select_one("h1")
    )
    name = name_el.get_text(strip=True) if name_el else None
    if not name:
        return None

    # Price
    price_el = (
        soup.select_one(".product-price-value")
        or soup.select_one("[class*='uniform-banner-box-price']")
        or soup.select_one("[class*='price']")
    )
    price_usd = _parse_price(price_el.get_text(strip=True) if price_el else "0")
    price_eur = round(price_usd * USD_TO_EUR, 2)

    # Image
    img_el = (
        soup.select_one("#magnifier img")
        or soup.select_one(".product-image-thumb-item img")
        or soup.select_one("[class*='product-image'] img")
    )
    image_url = img_el.get("src") or img_el.get("data-src") if img_el else None

    # Store name as brand
    store_el = soup.select_one("[class*='store-name'], [class*='storeName']")
    brand = store_el.get_text(strip=True) if store_el else "Unknown"

    item_id = _item_id_from_url(url)
    external_id = f"aliexpress_{item_id}" if item_id else hashlib.md5(url.encode()).hexdigest()[:16]
    category = _infer_category(name, url)

    return Product(
        source=Source.ALIEXPRESS,
        external_id=external_id,
        name=name,
        brand=brand,
        url=url,
        category=category,
        price=PricePoint(price=price_eur, currency="EUR", in_stock=True),
        image_url=image_url,
        tags=["aliexpress"],
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _dig(obj: dict, *keys: str):
    """Safely traverse nested dict keys, trying each key at each level."""
    current = obj
    for key in keys:
        if isinstance(current, dict):
            if key in current:
                current = current[key]
                continue
            # Try a depth-first search for the key
            for v in current.values():
                if isinstance(v, dict) and key in v:
                    current = v[key]
                    break
            else:
                return None
        else:
            return None
    return current


def _item_id_from_url(url: str) -> Optional[str]:
    """Extract AliExpress item ID from a URL."""
    match = re.search(r"/item/(\d+)\.html", url)
    return match.group(1) if match else None


def _extract_item_id(item: dict) -> Optional[str]:
    """Extract item ID from a search result JSON item."""
    for key in ("productId", "itemId", "item_id", "id"):
        val = item.get(key)
        if val:
            return str(val)
    # Recurse one level
    for v in item.values():
        if isinstance(v, dict):
            result = _extract_item_id(v)
            if result:
                return result
    return None


def _parse_price(text: str) -> float:
    """Extract numeric price from AliExpress price text like 'US $12.99' or '$3.50 - $8.00'."""
    if not text:
        return 0.0
    # Take the first price in a range
    match = re.search(r"[\d]+[.,][\d]+", text.replace(",", "."))
    try:
        return float(match.group(0)) if match else 0.0
    except (ValueError, AttributeError):
        return 0.0


def _infer_category(name: str, url: str) -> Category:
    """Infer Category from product name and URL."""
    combined = (name + " " + url).lower()
    if any(k in combined for k in ("nail gel", "uv gel", "builder gel", "nail polish", "nail art", "nail drill", "nail lamp", "nail tool", "nail decoration", "nail stamp")):
        return Category.NAIL_CARE
    if any(k in combined for k in ("serum", "essence", "ampoule")):
        return Category.SERUMS
    if any(k in combined for k in ("moisturiz", "cream", "lotion", "face cream")):
        return Category.MOISTURIZERS
    if any(k in combined for k in ("toner", "mist", "facial water")):
        return Category.TONERS
    if any(k in combined for k in ("mask", "sheet mask", "clay mask")):
        return Category.FACE_MASKS
    if any(k in combined for k in ("shampoo", "conditioner")):
        return Category.SHAMPOO_CONDITIONER
    if any(k in combined for k in ("hair", "scalp")):
        return Category.HAIRCARE
    if any(k in combined for k in ("perfume", "fragrance", "eau de")):
        return Category.FRAGRANCES
    return Category.SKINCARE


def _anonymise_product(product: Product) -> dict:
    """Convert a Product to an anonymised intelligence dict."""
    hash_input = f"{product.source.value}:{product.external_id}:{product.name}"
    product_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    price = product.price.price
    if price > 50:
        price_tier = "premium"
    elif price > 15:
        price_tier = "mid"
    elif price > 5:
        price_tier = "budget"
    else:
        price_tier = "ultra_budget"

    return {
        "product_hash": product_hash,
        "source": "aliexpress",
        "category": product.category.value,
        "name_clean": product.name[:255],
        "brand_type": "mass_market",
        "price_tier": price_tier,
        "efficacy_signals": {
            "rating": product.rating,
            "review_count": product.review_count,
            "has_ingredients": bool(getattr(product, "ingredients", None)),
        },
        "ingredient_profile": {"actives": [], "notable": []},
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


def _full_product_for_staging(product: Product) -> dict:
    """Convert a Product to a full staging dict that preserves ALL data."""
    hash_input = f"{product.source.value}:{product.external_id}:{product.name}"
    product_hash = hashlib.sha256(hash_input.encode()).hexdigest()[:16]

    price = product.price.price if product.price else 0
    if price > 50:
        price_tier = "premium"
    elif price > 15:
        price_tier = "mid"
    elif price > 5:
        price_tier = "budget"
    else:
        price_tier = "ultra_budget"

    return {
        "product_hash": product_hash,
        "source": "aliexpress",
        "source_product_id": product.external_id,
        "name_original": product.name,
        "brand": product.brand,
        "category": product.category.value if product.category else None,
        "price_tier": price_tier,
        "price_original": price,
        "price_currency": product.price.currency if product.price else "EUR",
        "image_url": product.image_url,
        "source_url": product.url,
        "description": getattr(product, "description", None),
        "ingredients": None,
        "rating": product.rating,
        "review_count": product.review_count,
        "in_stock": product.price.in_stock if product.price else None,
        "sale_price": product.price.sale_price if product.price else None,
        "scraped_at": datetime.utcnow().isoformat(),
    }


# ── CLI entrypoint ───────────────────────────────────────────────────────────

async def run(
    pages: int,
    output: str,
    category: Optional[str] = None,
    brands: Optional[list[str]] = None,
    min_seller_feedback: float = 98.0,
    min_store_age_days: int = 365,
):
    """Run the AliExpress scraper and write results to JSON."""
    scraper = AliExpressScraper(
        pages_per_category=pages,
        category_filter=category,
        brand_filter=brands,
        min_seller_feedback=min_seller_feedback,
        min_store_age_days=min_store_age_days,
    )
    async with scraper:
        result = await scraper.scrape()

    anonymised = [_anonymise_product(p) for p in result.products]
    staging = [_full_product_for_staging(p) for p in result.products]

    os.makedirs(os.path.dirname(output) or ".", exist_ok=True)
    with open(output, "w") as f:
        json.dump(anonymised, f, indent=2, ensure_ascii=False)

    staging_output = output.replace(".json", "_staging.json")
    with open(staging_output, "w") as f:
        json.dump(staging, f, indent=2, ensure_ascii=False)

    logger.info(
        f"Wrote {len(anonymised)} anonymised + {len(staging)} staging products to {output}"
    )
    return len(anonymised)


def main():
    parser = argparse.ArgumentParser(
        description="AliExpress product scraper (luminati-io pattern)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape by category (default — nail categories)
  python scrapers/aliexpress/scraper_api.py --pages 2

  # Scrape by brand name
  python scrapers/aliexpress/scraper_api.py --brand "Makartt"
  python scrapers/aliexpress/scraper_api.py --brand "Makartt,Beetles,Modelones" --pages 3

  # Brand narrowed to a specific category
  python scrapers/aliexpress/scraper_api.py --brand "Makartt" --category nail_gel
        """,
    )
    parser.add_argument("--pages", type=int, default=2, help="Pages per search query (default: 2)")
    parser.add_argument("--output", default="data/aliexpress_intelligence.json", help="Output JSON path")
    parser.add_argument(
        "--category",
        default=None,
        choices=list(CATEGORY_MAP.keys()),
        help=f"Category filter. Options: {', '.join(CATEGORY_MAP.keys())}",
    )
    parser.add_argument(
        "--brand",
        default=None,
        help='Brand name(s) to search, comma-separated. E.g. "Makartt" or "Makartt,Beetles,Modelones"',
    )
    parser.add_argument(
        "--min-feedback",
        type=float,
        default=98.0,
        help="Minimum seller positive feedback %% (default: 98.0). Set 0 to disable.",
    )
    parser.add_argument(
        "--min-store-age",
        type=int,
        default=365,
        help="Minimum store age in days (default: 365 = 1 year). Set 0 to disable.",
    )
    args = parser.parse_args()

    brands = [b.strip() for b in args.brand.split(",")] if args.brand else None
    asyncio.run(
        run(
            args.pages,
            args.output,
            args.category,
            brands,
            min_seller_feedback=args.min_feedback,
            min_store_age_days=args.min_store_age,
        )
    )


if __name__ == "__main__":
    main()
