"""Base scraper class with shared logic for all competitor scrapers."""

from __future__ import annotations

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
        request_delay: tuple = (1.0, 3.0),
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

        # Persistent browser session for JS rendering (created on first use)
        self._browser_mgr = None
        self._browser = None
        self._browser_page_count = 0
        self._max_pages_per_browser = 15  # Rotate browser after N pages

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=self.timeout),
            headers=self._default_headers(),
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        await self._close_browser()

    async def _close_browser(self):
        """Cleanly shut down the persistent browser."""
        if self._browser:
            try:
                await self._browser.close()
            except Exception:
                pass
            self._browser = None
        if self._browser_mgr:
            try:
                await self._browser_mgr.stop()
            except Exception:
                pass
            self._browser_mgr = None
        self._browser_page_count = 0

    async def _get_browser(self):
        """Get or create a persistent browser instance.

        Rotates the browser every N pages to avoid detection from
        long-lived sessions while still avoiding the per-request
        browser creation that triggers bot detection.
        """
        if self._browser_page_count >= self._max_pages_per_browser:
            logger.info(f"[{self.source.value}] Rotating browser after {self._browser_page_count} pages")
            await self._close_browser()

        if not self._browser_mgr:
            from scrapers.common.stealth_browser import StealthBrowserAsync

            self._browser_mgr = StealthBrowserAsync(self.proxy_manager)
            await self._browser_mgr.start()
            self._browser = await self._browser_mgr.new_browser()
            self._browser_page_count = 0

        return self._browser_mgr, self._browser

    def _default_headers(self) -> dict:
        """Use stealth proxy manager headers for realistic browser fingerprinting."""
        return self.proxy_manager.get_headers()

    async def _fetch(self, url: str, retry: int = 0) -> Optional[str]:
        """Fetch a URL with retry logic, rate limiting, and random delays."""
        async with self.rate_limiter:
            delay = random.uniform(*self.request_delay)
            await asyncio.sleep(delay)

            try:
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
                        logger.warning(f"[{self.source.value}] Blocked (403) on {url}")
                        if retry < self.max_retries:
                            await asyncio.sleep(random.uniform(10, 30))
                            return await self._fetch(url, retry + 1)
                    else:
                        logger.error(f"[{self.source.value}] HTTP {response.status} on {url}")
            except asyncio.TimeoutError:
                logger.error(f"[{self.source.value}] Timeout on {url}")
                if retry < self.max_retries:
                    return await self._fetch(url, retry + 1)
            except Exception as e:
                logger.error(f"[{self.source.value}] Error fetching {url}: {e}")
                if retry < self.max_retries:
                    return await self._fetch(url, retry + 1)

        return None

    async def _dismiss_cookie_banner(self, page) -> None:
        """Attempt to dismiss common cookie consent banners."""
        cookie_selectors = [
            # Common cookie banner buttons (DE/EN)
            "button:has-text('Alle akzeptieren')",
            "button:has-text('Alle Cookies akzeptieren')",
            "button:has-text('Accept All')",
            "button:has-text('Accept all cookies')",
            "button:has-text('Akzeptieren')",
            "button:has-text('Zustimmen')",
            "#onetrust-accept-btn-handler",
            "[data-testid='cookie-accept']",
            ".cookie-consent-accept",
            "button.accept-all",
            "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
        ]
        for selector in cookie_selectors:
            try:
                btn = await page.query_selector(selector)
                if btn and await btn.is_visible():
                    await btn.click()
                    logger.info(f"[{self.source.value}] Dismissed cookie banner via '{selector}'")
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    return
            except Exception:
                continue

    async def _human_scroll(self, page, scrolls: int = 3) -> None:
        """Simulate realistic human scrolling behaviour."""
        for _ in range(scrolls):
            await page.evaluate(
                """() => {
                    window.scrollBy(0, window.innerHeight * (0.3 + Math.random() * 0.5));
                }"""
            )
            await asyncio.sleep(random.uniform(0.8, 2.5))

    async def _fetch_js(
        self,
        url: str,
        wait_selector: str = "body",
        timeout_ms: int = 45000,
        retry: int = 0,
    ) -> Optional[str]:
        """Fetch a URL using a persistent Playwright browser session.

        Reuses a single browser across multiple pages (rotated every N pages)
        to mimic a real user browsing session rather than a bot spawning
        one browser per request.
        """
        try:
            browser_mgr, browser = await self._get_browser()
            page = await browser_mgr.new_page(browser)
            self._browser_page_count += 1

            try:
                # Random pre-navigation delay to look human
                await asyncio.sleep(random.uniform(1.0, 3.0))

                # Navigate
                response = await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)

                if response and response.status >= 400:
                    logger.warning(f"[{self.source.value}] HTTP {response.status} on {url}")
                    if retry < self.max_retries and response.status in (403, 429):
                        await page.close()
                        wait = random.uniform(10, 30) * (retry + 1)
                        logger.info(f"[{self.source.value}] Retrying in {wait:.0f}s...")
                        await asyncio.sleep(wait)
                        # Force browser rotation on 403
                        if response.status == 403:
                            await self._close_browser()
                        return await self._fetch_js(url, wait_selector, timeout_ms, retry + 1)

                # Dismiss cookie consent if present
                await self._dismiss_cookie_banner(page)

                # Wait for target content
                try:
                    await page.wait_for_selector(wait_selector, timeout=15000)
                except Exception:
                    logger.warning(f"[{self.source.value}] Selector '{wait_selector}' not found on {url}, continuing...")

                # Simulate human browsing behaviour
                await self._human_scroll(page)

                # Let lazy-loaded content render
                await asyncio.sleep(random.uniform(1.5, 4.0))

                html = await page.content()
                return html

            finally:
                try:
                    await page.close()
                except Exception:
                    pass

        except ImportError:
            logger.warning(f"[{self.source.value}] Playwright not installed, falling back to aiohttp for {url}")
            return await self._fetch(url)
        except Exception as e:
            logger.error(f"[{self.source.value}] Playwright error on {url}: {e}")
            # On error, close browser so next request gets a fresh one
            await self._close_browser()
            if retry < self.max_retries:
                await asyncio.sleep(random.uniform(5, 15))
                return await self._fetch_js(url, wait_selector, timeout_ms, retry + 1)
            return None

    @abstractmethod
    async def get_category_urls(self) -> list:
        """Return the list of category/listing page URLs to scrape."""
        ...

    @abstractmethod
    async def parse_listing(self, html: str, url: str) -> list:
        """Parse a listing page and return product URLs."""
        ...

    @abstractmethod
    async def parse_product(self, html: str, url: str) -> Optional[Product]:
        """Parse a product page and return a Product model."""
        ...

    async def scrape(self) -> ScraperResult:
        """Run the full scraping pipeline."""
        started_at = datetime.utcnow()
        products = []
        errors = []
        total_pages = 0

        logger.info(f"[{self.source.value}] Starting scrape...")

        category_urls = await self.get_category_urls()
        product_urls = []

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
        logger.info(f"[{self.source.value}] Found {len(product_urls)} product URLs")

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
