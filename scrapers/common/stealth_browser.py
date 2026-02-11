"""Playwright-based stealth browser with anti-detection for JS-heavy sites."""

import logging
import random
from typing import Optional

from proxy_rotation.manager import StealthProxyManager

logger = logging.getLogger(__name__)


class StealthBrowser:
    """Playwright with anti-detection measures.

    Use for sites that require JS rendering (Sephora, Amazon).
    Falls back gracefully if Playwright is not installed.

    Usage (sync):
        browser_mgr = StealthBrowser(proxy_manager)
        browser = browser_mgr.new_browser()
        page = browser_mgr.new_page(browser)
        page.goto("https://example.com")
        html = page.content()
        browser.close()

    Usage (async):
        browser_mgr = StealthBrowserAsync(proxy_manager)
        await browser_mgr.start()
        browser = await browser_mgr.new_browser()
        page = await browser_mgr.new_page(browser)
        await page.goto("https://example.com")
        html = await page.content()
        await browser.close()
        await browser_mgr.stop()
    """

    VIEWPORTS = [
        (1920, 1080),
        (1366, 768),
        (1440, 900),
        (1536, 864),
        (1280, 720),
    ]

    LOCALES = ["en-US", "en-GB", "de-DE", "fr-FR"]
    TIMEZONES = [
        "America/New_York",
        "America/Chicago",
        "America/Los_Angeles",
        "Europe/London",
        "Europe/Berlin",
        "Europe/Paris",
    ]

    STEALTH_SCRIPT = """
        // Remove webdriver flag
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });

        // Fake plugins array
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5]
        });

        // Fake Chrome runtime
        window.chrome = { runtime: {} };

        // Override permissions query
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
            parameters.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission })
                : originalQuery(parameters);

        // Fake languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en', 'de']
        });

        // Fake hardware concurrency (random 4-16)
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => Math.floor(Math.random() * 12) + 4
        });

        // Fake device memory
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => [4, 8, 16][Math.floor(Math.random() * 3)]
        });
    """

    def __init__(self, proxy_manager: StealthProxyManager):
        self.proxy_manager = proxy_manager
        self._playwright = None

    def start(self):
        """Start the sync Playwright instance."""
        from playwright.sync_api import sync_playwright

        self._pw_context = sync_playwright().start()
        self._playwright = self._pw_context
        return self

    def stop(self):
        """Stop the sync Playwright instance."""
        if self._playwright:
            self._playwright.stop()
            self._playwright = None

    def __enter__(self):
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()

    def _get_launch_args(self) -> list[str]:
        """Chromium args for anti-detection."""
        width, height = random.choice(self.VIEWPORTS)
        return [
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-infobars",
            "--disable-background-networking",
            "--disable-dev-shm-usage",
            "--no-first-run",
            f"--window-size={width},{height}",
        ]

    def _get_proxy_config(self) -> Optional[dict]:
        """Build Playwright proxy config from proxy manager."""
        proxy = self.proxy_manager.get_proxy()
        if not proxy:
            return None

        from urllib.parse import urlparse

        parsed = urlparse(proxy["http"])
        config = {"server": f"{parsed.scheme}://{parsed.hostname}:{parsed.port}"}
        if parsed.username:
            config["username"] = parsed.username
        if parsed.password:
            config["password"] = parsed.password
        return config

    def new_browser(self):
        """Launch a new browser instance with stealth config and proxy."""
        if not self._playwright:
            raise RuntimeError("Call .start() or use as context manager first.")

        launch_kwargs = {
            "headless": True,
            "args": self._get_launch_args(),
        }

        proxy_config = self._get_proxy_config()
        if proxy_config:
            launch_kwargs["proxy"] = proxy_config

        browser = self._playwright.chromium.launch(**launch_kwargs)
        return browser

    def new_page(self, browser):
        """Create a new page with randomized fingerprint and stealth scripts."""
        width = random.randint(1200, 1920)
        height = random.randint(800, 1080)

        context = browser.new_context(
            viewport={"width": width, "height": height},
            user_agent=self.proxy_manager.get_headers()["User-Agent"],
            locale=random.choice(self.LOCALES),
            timezone_id=random.choice(self.TIMEZONES),
            geolocation={
                "latitude": round(random.uniform(25, 60), 4),
                "longitude": round(random.uniform(-130, 30), 4),
            },
            permissions=["geolocation"],
            color_scheme=random.choice(["light", "dark", "no-preference"]),
            java_script_enabled=True,
            bypass_csp=True,
        )

        # Inject stealth scripts before any page loads
        context.add_init_script(self.STEALTH_SCRIPT)

        page = context.new_page()

        # Add realistic mouse movement simulation
        page.evaluate(
            """() => {
            let lastX = 0, lastY = 0;
            const move = () => {
                lastX += (Math.random() - 0.5) * 100;
                lastY += (Math.random() - 0.5) * 100;
                lastX = Math.max(0, Math.min(window.innerWidth, lastX));
                lastY = Math.max(0, Math.min(window.innerHeight, lastY));
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: lastX, clientY: lastY
                }));
                setTimeout(move, Math.random() * 3000 + 1000);
            };
            setTimeout(move, Math.random() * 2000 + 500);
        }"""
        )

        return page


class StealthBrowserAsync:
    """Async version of StealthBrowser for use with asyncio scrapers."""

    def __init__(self, proxy_manager: StealthProxyManager):
        self.proxy_manager = proxy_manager
        self._playwright = None
        self._sync_helper = StealthBrowser(proxy_manager)

    async def start(self):
        """Start the async Playwright instance."""
        from playwright.async_api import async_playwright

        self._pw_context = async_playwright()
        self._playwright = await self._pw_context.start()
        return self

    async def stop(self):
        """Stop the async Playwright instance."""
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    async def __aenter__(self):
        return await self.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def new_browser(self):
        """Launch a new browser instance with stealth config and proxy."""
        if not self._playwright:
            raise RuntimeError("Call .start() or use as async context manager first.")

        launch_kwargs = {
            "headless": True,
            "args": self._sync_helper._get_launch_args(),
        }

        proxy_config = self._sync_helper._get_proxy_config()
        if proxy_config:
            launch_kwargs["proxy"] = proxy_config

        browser = await self._playwright.chromium.launch(**launch_kwargs)
        return browser

    async def new_page(self, browser):
        """Create a new page with randomized fingerprint and stealth scripts."""
        width = random.randint(1200, 1920)
        height = random.randint(800, 1080)

        context = await browser.new_context(
            viewport={"width": width, "height": height},
            user_agent=self.proxy_manager.get_headers()["User-Agent"],
            locale=random.choice(StealthBrowser.LOCALES),
            timezone_id=random.choice(StealthBrowser.TIMEZONES),
            geolocation={
                "latitude": round(random.uniform(25, 60), 4),
                "longitude": round(random.uniform(-130, 30), 4),
            },
            permissions=["geolocation"],
            color_scheme=random.choice(["light", "dark", "no-preference"]),
            java_script_enabled=True,
            bypass_csp=True,
        )

        context.add_init_script(StealthBrowser.STEALTH_SCRIPT)

        page = await context.new_page()

        await page.evaluate(
            """() => {
            let lastX = 0, lastY = 0;
            const move = () => {
                lastX += (Math.random() - 0.5) * 100;
                lastY += (Math.random() - 0.5) * 100;
                lastX = Math.max(0, Math.min(window.innerWidth, lastX));
                lastY = Math.max(0, Math.min(window.innerHeight, lastY));
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: lastX, clientY: lastY
                }));
                setTimeout(move, Math.random() * 3000 + 1000);
            };
            setTimeout(move, Math.random() * 2000 + 500);
        }"""
        )

        return page
