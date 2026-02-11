"""Base scraper class with shared logic for all competitor scrapers."""

import asyncio
import logging
import random
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Optional

import aiohttp
from fake_useragent import UserAgent

from scrapers.common.models import Product, ScraperResult, Source
from scrapers.common.rate_limiter import RateLimiter
from scrapers.common.user_agents import get_random_user_agent
from proxy_rotation.manager import StealthProxyManager

logger = logging.getLogger(__name__)


class BaseScraper(ABC):
    """Abstract base class for all competitor scrapers."""

    def __init__(
        self,
        source: Source,
        max_concurrent: int = 3,
        request_delay: tuple[float, float] = (1.0, 3.0),
        max_retries: int = 3,
        timeout: int = 30,
        proxy_manager: Optional[StealthProxyManager] = None,
    ):
        self.source = source
        self.max_concurrent = max_concurrent
        self.request_delay = request_delay
        self.max_retries = max_retries
        self.timeout = timeout
        self.proxy_manager = proxy_manager or StealthProxyManager(use_aws_secrets=False)
        self.rate_limiter = RateLimiter(max_concurrent)
        self.session: Optional[aiohttp.ClientSession] = None
        self._ua = UserAgent(browsers=["chrome", "firefox", "edge"])

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers=self._default_headers(),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    def _default_headers(self) -> dict[str, str]:
        """Use stealth proxy manager headers for realistic browser fingerprinting."""
        return self.proxy_manager.get_headers()

    async def _fetch(self, url: str, retry: int = 0) -> Optional[str]:
        """Fetch a URL with retry logic, rate limiting, and random delays."""
        async with self.rate_limiter:
            # Random delay between requests to avoid detection
            delay = random.uniform(*self.request_delay)
            await asyncio.sleep(delay)

            try:
                # Get fresh stealth headers and proxy for each request
                headers = self.proxy_manager.get_headers()
                proxy_url = self.proxy_manager.get_proxy_url()
                kwargs = {"headers": headers}
                if proxy_url:
                    kwargs["proxy"] = proxy_url

                async with self.session.get(url, **kwargs) as response:
                    if response.status == 200:
                        if proxy_url:
                            self.proxy_manager.report_success(proxy_url)
                        return await response.text()
                    elif response.status == 429:
                        # Rate limited — exponential backoff
                        wait = (2**retry) * 5 + random.uniform(1, 5)
                        logger.warning(
                            f"[{self.source.value}] Rate limited on {url}, "
                            f"waiting {wait:.1f}s (retry {retry + 1}/{self.max_retries})"
                        )
                        await asyncio.sleep(wait)
                        if retry < self.max_retries:
                            return await self._fetch(url, retry + 1)
                    elif response.status == 403:
                        if proxy_url:
                            self.proxy_manager.report_failure(proxy_url)
                        logger.warning(
                            f"[{self.source.value}] Blocked (403) on {url}"
                        )
                        if retry < self.max_retries:
                            await asyncio.sleep(random.uniform(10, 30))
                            return await self._fetch(url, retry + 1)
                    else:
                        logger.error(
                            f"[{self.source.value}] HTTP {response.status} on {url}"
                        )
            except asyncio.TimeoutError:
                logger.error(f"[{self.source.value}] Timeout on {url}")
                if retry < self.max_retries:
                    return await self._fetch(url, retry + 1)
            except Exception as e:
                logger.error(f"[{self.source.value}] Error fetching {url}: {e}")
                if retry < self.max_retries:
                    return await self._fetch(url, retry + 1)

        return None

    async def _fetch_js(self, url: str, wait_selector: str = "body", timeout_ms: int = 30000) -> Optional[str]:
        """Fetch a URL using Playwright for JS-rendered pages.

        Use this for sites with heavy anti-bot JS (Sephora, Amazon).
        Falls back to aiohttp _fetch() if Playwright is unavailable.
        """
        try:
            from scrapers.common.stealth_browser import StealthBrowserAsync

            async with StealthBrowserAsync(self.proxy_manager) as browser_mgr:
                browser = await browser_mgr.new_browser()
                try:
                    page = await browser_mgr.new_page(browser)

                    # Random pre-navigation delay
                    await asyncio.sleep(random.uniform(0.5, 2.0))

                    await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)

                    # Wait for target content
                    try:
                        await page.wait_for_selector(wait_selector, timeout=timeout_ms)
                    except Exception:
                        logger.warning(f"[{self.source.value}] Selector '{wait_selector}' not found on {url}")

                    # Simulate human-like scroll behavior
                    await page.evaluate(
                        """async () => {
                        const delay = ms => new Promise(r => setTimeout(r, ms));
                        for (let i = 0; i < 3; i++) {
                            window.scrollBy(0, window.innerHeight * (0.3 + Math.random() * 0.5));
                            await delay(500 + Math.random() * 1500);
                        }
                    }"""
                    )

                    # Small delay to let lazy-loaded content render
                    await asyncio.sleep(random.uniform(1.0, 3.0))

                    html = await page.content()
                    return html
                finally:
                    await browser.close()

        except ImportError:
            logger.warning(
                f"[{self.source.value}] Playwright not installed, falling back to aiohttp for {url}"
            )
            return await self._fetch(url)
        except Exception as e:
            logger.error(f"[{self.source.value}] Playwright error on {url}: {e}")
            return None

    @abstractmethod
    async def get_category_urls(self) -> list[str]:
        """Return the list of category/listing page URLs to scrape."""
        ...

    @abstractmethod
    async def parse_listing(self, html: str, url: str) -> list[str]:
        """Parse a listing page and return product URLs."""
        ...

    @abstractmethod
    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse a product page and return a Product model."""
        ...

    async def scrape(self) -> ScraperResult:
        """Run the full scraping pipeline."""
        started_at = datetime.utcnow()
        products: list[Product] = []
        errors: list[str] = []
        total_pages = 0

        logger.info(f"[{self.source.value}] Starting scrape...")

        category_urls = await self.get_category_urls()
        product_urls: list[str] = []

        # Phase 1: Collect product URLs from listing pages
        for cat_url in category_urls:
            html = await self._fetch(cat_url)
            if html:
                total_pages += 1
                try:
                    urls = await self.parse_listing(html, cat_url)
                    product_urls.extend(urls)
                except Exception as e:
                    errors.append(f"Listing parse error ({cat_url}): {e}")

        # Deduplicate
        product_urls = list(set(product_urls))
        logger.info(
            f"[{self.source.value}] Found {len(product_urls)} product URLs"
        )

        # Phase 2: Scrape individual product pages
        for url in product_urls:
            html = await self._fetch(url)
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
