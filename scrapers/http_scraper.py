"""
Lightweight HTTP-only product scraper.

Does NOT require Playwright or any headless browser.
Uses aiohttp + BeautifulSoup with real browser headers to scrape
product data from sites that serve HTML content.

Also includes an Open Beauty Facts API scraper as a guaranteed
data source (public API, no anti-bot).

Usage:
    python scrapers/http_scraper.py --pages 1
    python scrapers/http_scraper.py --pages 2 --source openfacts
    python scrapers/http_scraper.py --pages 1 --source amazon
"""

import argparse
import asyncio
import hashlib
import json
import logging
import os
import re
import sys
from datetime import datetime, timezone
from typing import Optional

import aiohttp
from bs4 import BeautifulSoup

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Realistic browser headers
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0",
}

# --- Ingredient intelligence ---
ACTIVE_INGREDIENTS = {
    "niacinamide": {"concerns": ["pores", "brightening", "oil control"], "tier": "proven"},
    "retinol": {"concerns": ["anti-aging", "wrinkles", "cell turnover"], "tier": "proven"},
    "vitamin c": {"concerns": ["brightening", "antioxidant", "dark spots"], "tier": "proven"},
    "ascorbic acid": {"concerns": ["brightening", "antioxidant"], "tier": "proven"},
    "hyaluronic acid": {"concerns": ["hydration", "plumping"], "tier": "proven"},
    "salicylic acid": {"concerns": ["acne", "exfoliation", "pores"], "tier": "proven"},
    "glycolic acid": {"concerns": ["exfoliation", "brightening", "texture"], "tier": "proven"},
    "lactic acid": {"concerns": ["gentle exfoliation", "hydration"], "tier": "proven"},
    "azelaic acid": {"concerns": ["rosacea", "brightening", "acne"], "tier": "proven"},
    "ceramides": {"concerns": ["barrier repair", "hydration"], "tier": "proven"},
    "peptides": {"concerns": ["anti-aging", "firming"], "tier": "emerging"},
    "squalane": {"concerns": ["hydration", "barrier"], "tier": "proven"},
    "centella asiatica": {"concerns": ["calming", "healing"], "tier": "proven"},
    "bakuchiol": {"concerns": ["anti-aging", "retinol alternative"], "tier": "emerging"},
    "zinc": {"concerns": ["oil control", "acne"], "tier": "proven"},
    "tea tree": {"concerns": ["acne", "antibacterial"], "tier": "proven"},
    "argan oil": {"concerns": ["hydration", "nourishing"], "tier": "proven"},
    "jojoba": {"concerns": ["hydration", "balance"], "tier": "proven"},
    "aloe vera": {"concerns": ["soothing", "hydration"], "tier": "proven"},
    "shea butter": {"concerns": ["moisturizing", "barrier"], "tier": "proven"},
    "collagen": {"concerns": ["anti-aging", "plumping"], "tier": "marketing"},
    "vitamin e": {"concerns": ["antioxidant", "moisturizing"], "tier": "proven"},
    "snail mucin": {"concerns": ["hydration", "healing", "anti-aging"], "tier": "emerging"},
    "benzoyl peroxide": {"concerns": ["acne", "antibacterial"], "tier": "proven"},
    "kojic acid": {"concerns": ["brightening", "dark spots"], "tier": "proven"},
    "tranexamic acid": {"concerns": ["dark spots", "brightening"], "tier": "emerging"},
    "alpha arbutin": {"concerns": ["brightening", "dark spots"], "tier": "proven"},
}


def _hash_product(name: str, brand: str, source: str) -> str:
    raw = f"{source}:{brand.lower().strip()}:{name.lower().strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def _detect_actives(text: str) -> list[dict]:
    text_lower = text.lower()
    found = []
    for ingredient, info in ACTIVE_INGREDIENTS.items():
        if ingredient in text_lower:
            found.append({"name": ingredient, **info})
    return found


def _classify_price_tier(price: float) -> str:
    if price < 10:
        return "budget"
    elif price < 25:
        return "mid"
    elif price < 60:
        return "premium"
    return "luxury"


def _classify_product_type(name: str) -> str:
    name_lower = name.lower()
    type_map = {
        "serum": "serum", "sérum": "serum",
        "moisturiz": "moisturizer", "feuchtigk": "moisturizer", "creme": "moisturizer", "cream": "moisturizer",
        "cleanser": "cleanser", "reinig": "cleanser", "wash": "cleanser",
        "toner": "toner", "gesichtswasser": "toner",
        "mask": "mask", "maske": "mask",
        "sunscreen": "sunscreen", "spf": "sunscreen", "sonnenschutz": "sunscreen",
        "oil": "face_oil", "öl": "face_oil",
        "eye": "eye_cream", "augen": "eye_cream",
        "shampoo": "shampoo",
        "conditioner": "conditioner", "spülung": "conditioner",
        "parfum": "fragrance", "perfume": "fragrance", "eau de": "fragrance",
        "lip": "lip_care", "lippen": "lip_care",
        "nail": "nail_care", "nagel": "nail_care",
        "body": "body_care", "körper": "body_care",
    }
    for keyword, ptype in type_map.items():
        if keyword in name_lower:
            return ptype
    return "skincare"


def _classify_category(product_type: str) -> str:
    cat_map = {
        "serum": "serums", "moisturizer": "moisturizers", "cleanser": "skincare",
        "toner": "toners", "mask": "face_masks", "sunscreen": "skincare",
        "face_oil": "skincare", "eye_cream": "skincare",
        "shampoo": "shampoo_conditioner", "conditioner": "shampoo_conditioner",
        "fragrance": "fragrances", "lip_care": "skincare",
        "nail_care": "nail_care", "body_care": "skincare", "skincare": "skincare",
    }
    return cat_map.get(product_type, "skincare")


def _compute_efficacy(actives: list[dict], rating: float, review_count: int) -> float:
    score = 0.0
    # Active ingredients (max 5.0)
    proven = sum(1 for a in actives if a.get("tier") == "proven")
    emerging = sum(1 for a in actives if a.get("tier") == "emerging")
    score += min(proven * 1.2 + emerging * 0.6, 5.0)
    # Rating boost (max 3.0)
    if rating > 0:
        score += (rating / 5.0) * 3.0
    # Review confidence (max 2.0)
    if review_count > 100:
        score += 2.0
    elif review_count > 20:
        score += 1.0
    elif review_count > 5:
        score += 0.5
    return round(min(score, 10.0), 2)


# ============================================
# Source: Open Beauty Facts (guaranteed API v2)
# ============================================
def _fetch_obf_url_sync(url: str) -> Optional[dict]:
    """Fetch a single Open Beauty Facts API URL using urllib (stdlib).
    Falls back to this if aiohttp has issues with the API."""
    import urllib.request
    import urllib.error
    req = urllib.request.Request(url, headers={
        "User-Agent": "CrazyGels-Scraper/1.0 (contact: hello@crazygels.com)",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read()
            text = raw.decode("utf-8", errors="replace")
            if text and text.strip().startswith(("{", "[")):
                return json.loads(text)
            else:
                logger.warning(f"  [OBF-sync] Non-JSON response (len={len(text)}): {text[:120]}")
                return None
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as e:
        logger.error(f"  [OBF-sync] Request failed: {e}")
        return None


async def scrape_open_beauty_facts(session: aiohttp.ClientSession, pages: int = 2) -> list[dict]:
    """Scrape from Open Beauty Facts API v2 -- free, no anti-bot, always works.

    Uses the v2 search endpoint which returns proper JSON.
    Has a sync fallback using urllib if aiohttp gets non-JSON responses.
    """
    products = []
    categories = [
        ("moisturizers", "en:moisturizers"),
        ("face creams", "en:face-creams"),
        ("serums", "en:face-serums"),
        ("cleansers", "en:face-cleansers"),
        ("shampoos", "en:shampoos"),
        ("conditioners", "en:hair-conditioners"),
        ("sunscreens", "en:sunscreen"),
        ("lip care", "en:lip-balms"),
        ("body lotions", "en:body-milks"),
        ("face masks", "en:face-masks"),
    ]

    api_fields = "code,product_name,brands,ingredients_text,image_url,categories_tags"
    use_sync_fallback = False  # Switch to urllib if aiohttp fails repeatedly

    for cat_name, cat_tag in categories:
        for page in range(1, pages + 1):
            url = (
                f"https://world.openbeautyfacts.org/api/v2/search"
                f"?categories_tags={cat_tag}"
                f"&page_size=50&page={page}"
                f"&fields={api_fields}"
            )

            data = None
            try:
                if use_sync_fallback:
                    # Use synchronous urllib fallback
                    logger.info(f"  [OpenBeautyFacts] Fetching {cat_name} page {page} (sync fallback)...")
                    data = await asyncio.get_event_loop().run_in_executor(
                        None, _fetch_obf_url_sync, url
                    )
                else:
                    # Try aiohttp first
                    logger.info(f"  [OpenBeautyFacts] Fetching {cat_name} page {page}...")
                    api_headers = {
                        "User-Agent": "CrazyGels-Scraper/1.0 (contact: hello@crazygels.com)",
                        "Accept": "application/json",
                    }
                    async with session.get(url, headers=api_headers, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                        if resp.status != 200:
                            logger.warning(f"  [OpenBeautyFacts] {cat_name} page {page}: HTTP {resp.status}")
                            continue
                        raw_bytes = await resp.read()
                        text = raw_bytes.decode("utf-8", errors="replace")
                        if not text or not text.strip().startswith(("{", "[")):
                            logger.warning(f"  [OpenBeautyFacts] {cat_name} page {page}: non-JSON from aiohttp (len={len(text)}), switching to sync fallback")
                            logger.warning(f"  [OpenBeautyFacts] Response starts with: {text[:200]}")
                            use_sync_fallback = True
                            # Retry this page with sync fallback
                            data = await asyncio.get_event_loop().run_in_executor(
                                None, _fetch_obf_url_sync, url
                            )
                        else:
                            data = json.loads(text)
            except Exception as e:
                logger.error(f"  [OpenBeautyFacts] {cat_name} page {page} aiohttp error: {e}, trying sync fallback...")
                use_sync_fallback = True
                try:
                    data = await asyncio.get_event_loop().run_in_executor(
                        None, _fetch_obf_url_sync, url
                    )
                except Exception as e2:
                    logger.error(f"  [OpenBeautyFacts] {cat_name} page {page} sync also failed: {e2}")

            if not data:
                continue

            page_products = data.get("products", [])
            total_available = data.get("count", 0)
            page_count = data.get("page_count", pages)

            for item in page_products:
                name = item.get("product_name", "").strip()
                brand = item.get("brands", "").strip()
                if not name or len(name) < 3:
                    continue

                ingredients_text = item.get("ingredients_text", "") or ""
                description = ingredients_text[:500] if ingredients_text else name

                search_text = f"{name} {brand} {ingredients_text}"
                actives = _detect_actives(search_text)

                product_type = _classify_product_type(name)
                category = _classify_category(product_type)

                brand_lower = brand.lower()
                if any(b in brand_lower for b in ["la mer", "chanel", "dior", "estée", "lancôme", "sisley"]):
                    est_price = 85.0
                elif any(b in brand_lower for b in ["clinique", "origins", "shiseido", "biotherm", "clarins"]):
                    est_price = 42.0
                elif any(b in brand_lower for b in ["cerave", "neutrogena", "nivea", "garnier", "l'oréal"]):
                    est_price = 14.0
                elif any(b in brand_lower for b in ["the ordinary", "inkey", "revolution"]):
                    est_price = 9.0
                else:
                    est_price = 22.0

                efficacy = _compute_efficacy(actives, 0, 0)
                product_hash = _hash_product(name, brand, "openfacts")

                products.append({
                    "product_hash": product_hash,
                    "name": name,
                    "brand": brand,
                    "source": "open_beauty_facts",
                    "category": category,
                    "product_type": product_type,
                    "price": est_price,
                    "currency": "EUR",
                    "price_tier": _classify_price_tier(est_price),
                    "rating": None,
                    "review_count": 0,
                    "ingredients": ingredients_text[:1000] if ingredients_text else None,
                    "image_url": item.get("image_url"),
                    "url": f"https://world.openbeautyfacts.org/product/{item.get('code', '')}",
                    "actives": [a["name"] for a in actives],
                    "concerns": list(set(c for a in actives for c in a.get("concerns", []))),
                    "efficacy_score": efficacy,
                    "description": description[:500],
                    "scraped_at": datetime.now(timezone.utc).isoformat(),
                })

            logger.info(f"  [OpenBeautyFacts] {cat_name} page {page}/{page_count}: {len(page_products)} raw ({total_available} available) -> {len(products)} total")
            await asyncio.sleep(1)  # Be polite

            # Stop fetching if we've reached the last available page
            if page >= page_count:
                break

    logger.info(f"  [OpenBeautyFacts] Total: {len(products)} products")
    return products


# ============================================
# Source: Amazon DE (HTTP only, no Playwright)
# ============================================
async def scrape_amazon_http(session: aiohttp.ClientSession, pages: int = 1) -> list[dict]:
    """Try to scrape Amazon DE search results with plain HTTP.
    May return 0 results if Amazon blocks, but worth trying."""
    products = []
    searches = [
        ("skincare_serums", "gesichtsserum", "serums"),
        ("moisturizers", "gesichtscreme+feuchtigkeitspflege", "moisturizers"),
        ("shampoo", "shampoo+haarpflege", "shampoo_conditioner"),
        ("fragrances", "damenparfum", "fragrances"),
    ]

    for slug, query, category in searches:
        for page in range(1, pages + 1):
            url = f"https://www.amazon.de/s?k={query}&page={page}"
            try:
                logger.info(f"  [Amazon] Fetching {slug} page {page}...")
                async with session.get(url, headers=HEADERS, timeout=aiohttp.ClientTimeout(total=20)) as resp:
                    if resp.status != 200:
                        logger.warning(f"  [Amazon] {slug} page {page}: HTTP {resp.status}")
                        continue
                    html = await resp.text()

                soup = BeautifulSoup(html, "html.parser")

                # Find product cards
                cards = soup.select("[data-component-type='s-search-result']")
                if not cards:
                    cards = soup.select(".s-result-item[data-asin]")

                for card in cards:
                    asin = card.get("data-asin", "")
                    if not asin or len(asin) < 5:
                        continue

                    # Name
                    name_el = card.select_one("h2 a span") or card.select_one(".a-text-normal")
                    name = name_el.get_text(strip=True) if name_el else ""
                    if not name:
                        continue

                    # Price
                    price_el = card.select_one(".a-price .a-offscreen")
                    price = 0.0
                    if price_el:
                        price_text = price_el.get_text(strip=True).replace("€", "").replace(",", ".").strip()
                        try:
                            price = float(re.sub(r"[^\d.]", "", price_text))
                        except ValueError:
                            pass

                    # Rating
                    rating = 0.0
                    rating_el = card.select_one("[aria-label*='von 5']") or card.select_one(".a-icon-alt")
                    if rating_el:
                        rating_text = rating_el.get("aria-label", "") or rating_el.get_text("")
                        m = re.search(r"([\d,]+)", rating_text)
                        if m:
                            try:
                                rating = float(m.group(1).replace(",", "."))
                            except ValueError:
                                pass

                    # Review count
                    review_count = 0
                    review_el = card.select_one("[aria-label*='Bewertung']") or card.select_one(".a-size-base.s-underline-text")
                    if review_el:
                        rc_text = review_el.get("aria-label", "") or review_el.get_text("")
                        m = re.search(r"([\d.]+)", rc_text.replace(".", ""))
                        if m:
                            try:
                                review_count = int(m.group(1))
                            except ValueError:
                                pass

                    # Brand guess from name
                    brand = name.split(" ")[0] if name else "Unknown"
                    brand_el = card.select_one(".a-size-base-plus.a-color-base")
                    if brand_el:
                        brand = brand_el.get_text(strip=True)

                    # Image
                    img = card.select_one("img.s-image")
                    image_url = img.get("src") if img else None

                    actives = _detect_actives(name)
                    product_type = _classify_product_type(name)
                    efficacy = _compute_efficacy(actives, rating, review_count)
                    product_hash = _hash_product(name, brand, "amazon")

                    products.append({
                        "product_hash": product_hash,
                        "name": name,
                        "brand": brand,
                        "source": "amazon_de",
                        "category": category,
                        "product_type": product_type,
                        "price": price,
                        "currency": "EUR",
                        "price_tier": _classify_price_tier(price) if price > 0 else "unknown",
                        "rating": rating if rating > 0 else None,
                        "review_count": review_count,
                        "ingredients": None,
                        "image_url": image_url,
                        "url": f"https://www.amazon.de/dp/{asin}",
                        "actives": [a["name"] for a in actives],
                        "concerns": list(set(c for a in actives for c in a.get("concerns", []))),
                        "efficacy_score": efficacy,
                        "description": name,
                        "scraped_at": datetime.now(timezone.utc).isoformat(),
                    })

                logger.info(f"  [Amazon] {slug} page {page}: {len(cards)} cards -> {len(products)} total")
                await asyncio.sleep(3)

            except Exception as e:
                logger.error(f"  [Amazon] {slug} page {page} error: {e}")

    logger.info(f"  [Amazon] Total: {len(products)} products")
    return products


# ============================================
# Main
# ============================================
async def run(pages: int = 1, source: str = "all"):
    products = []
    connector = aiohttp.TCPConnector(limit=3)
    async with aiohttp.ClientSession(connector=connector) as session:
        if source in ("all", "openfacts"):
            logger.info("--- Open Beauty Facts ---")
            obf = await scrape_open_beauty_facts(session, pages)
            products.extend(obf)

        if source in ("all", "amazon"):
            logger.info("--- Amazon DE (HTTP) ---")
            amz = await scrape_amazon_http(session, pages)
            products.extend(amz)

    return products


def main():
    parser = argparse.ArgumentParser(description="Lightweight HTTP product scraper")
    parser.add_argument("--pages", type=int, default=1, help="Pages per category")
    parser.add_argument("--source", default="all", choices=["all", "openfacts", "amazon"],
                        help="Which source to scrape")
    parser.add_argument("--output", default="data/http_intelligence.json",
                        help="Output file path")
    args = parser.parse_args()

    logger.info(f"Starting HTTP scraper: source={args.source}, pages={args.pages}")
    started = datetime.now(timezone.utc)

    products = asyncio.run(run(args.pages, args.source))

    # Deduplicate by product_hash
    seen = set()
    unique = []
    for p in products:
        if p["product_hash"] not in seen:
            seen.add(p["product_hash"])
            unique.append(p)

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_products": len(unique),
        "sources": {},
        "products": unique,
    }
    # Count by source
    for p in unique:
        src = p.get("source", "unknown")
        output["sources"][src] = output["sources"].get(src, 0) + 1

    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    elapsed = (datetime.now(timezone.utc) - started).total_seconds()
    logger.info(f"\n{'='*50}")
    logger.info(f"HTTP scraper complete in {elapsed:.0f}s")
    logger.info(f"{'='*50}")
    for src, count in output["sources"].items():
        logger.info(f"  {src:>25}: {count:>4} products")
    logger.info(f"  {'TOTAL':>25}: {len(unique):>4} products")
    logger.info(f"  Output: {args.output}")


if __name__ == "__main__":
    main()
