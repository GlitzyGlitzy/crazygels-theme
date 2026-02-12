"""Playwright-based stealth browser with anti-detection for JS-heavy sites."""

from __future__ import annotations

import logging
import random
from typing import Optional

from proxy_rotation.manager import StealthProxyManager

logger = logging.getLogger(__name__)


class StealthBrowser:
    """Playwright with anti-detection measures.

    Use for sites that require JS rendering (Sephora, Amazon).
    Falls back gracefully if Playwright is not installed.
    """

    VIEWPORTS = [
        (1920, 1080),
        (1366, 768),
        (1440, 900),
        (1536, 864),
        (1280, 720),
        (1600, 900),
        (2560, 1440),
    ]

    LOCALES = ["de-DE", "en-US", "en-GB", "fr-FR"]
    TIMEZONES = [
        "Europe/Berlin",
        "Europe/Paris",
        "Europe/London",
        "America/New_York",
        "America/Chicago",
        "America/Los_Angeles",
    ]

    # Comprehensive stealth injection that passes common bot detectors
    STEALTH_SCRIPT = """
        // ── 1. Remove webdriver flag ──
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
        // Also delete from prototype
        delete navigator.__proto__.webdriver;

        // ── 2. Fake plugins (matching real Chrome) ──
        Object.defineProperty(navigator, 'plugins', {
            get: () => {
                const plugins = [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
                ];
                plugins.length = 3;
                return plugins;
            }
        });

        // ── 3. Fake mimeTypes ──
        Object.defineProperty(navigator, 'mimeTypes', {
            get: () => {
                const mimes = [
                    { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
                ];
                mimes.length = 1;
                return mimes;
            }
        });

        // ── 4. Fake Chrome runtime ──
        window.chrome = {
            runtime: {
                onMessage: { addListener: () => {}, removeListener: () => {} },
                sendMessage: () => {},
                connect: () => ({ onMessage: { addListener: () => {} }, postMessage: () => {} }),
            },
            loadTimes: () => ({}),
            csi: () => ({}),
        };

        // ── 5. Override permissions query ──
        const origQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) =>
            parameters.name === 'notifications'
                ? Promise.resolve({ state: Notification.permission })
                : origQuery(parameters);

        // ── 6. Fake languages ──
        Object.defineProperty(navigator, 'languages', {
            get: () => ['de-DE', 'de', 'en-US', 'en']
        });

        // ── 7. Hardware concurrency (realistic range) ──
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => [4, 8, 12, 16][Math.floor(Math.random() * 4)]
        });

        // ── 8. Device memory ──
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => [4, 8, 16][Math.floor(Math.random() * 3)]
        });

        // ── 9. WebGL vendor/renderer spoofing ──
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            if (parameter === 37445) return 'Google Inc. (NVIDIA)';
            if (parameter === 37446) return 'ANGLE (NVIDIA, NVIDIA GeForce GTX 1650 Direct3D11 vs_5_0 ps_5_0, D3D11)';
            return getParameter.call(this, parameter);
        };

        // ── 10. Canvas fingerprint noise ──
        const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(type) {
            if (type === 'image/png' && this.width > 16) {
                const ctx = this.getContext('2d');
                if (ctx) {
                    const imageData = ctx.getImageData(0, 0, 1, 1);
                    imageData.data[0] = imageData.data[0] ^ (Math.random() * 2 | 0);
                    ctx.putImageData(imageData, 0, 0);
                }
            }
            return origToDataURL.apply(this, arguments);
        };

        // ── 11. Prevent iframe detection ──
        Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight });
        Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth });

        // ── 12. Fake connection info ──
        if (navigator.connection) {
            Object.defineProperty(navigator.connection, 'rtt', { get: () => 50 });
        }
    """

    def __init__(self, proxy_manager: StealthProxyManager):
        self.proxy_manager = proxy_manager
        self._playwright = None

    def start(self):
        from playwright.sync_api import sync_playwright
        self._pw_context = sync_playwright().start()
        self._playwright = self._pw_context
        return self

    def stop(self):
        if self._playwright:
            self._playwright.stop()
            self._playwright = None

    def __enter__(self):
        return self.start()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()

    def _get_launch_args(self) -> list:
        width, height = random.choice(self.VIEWPORTS)
        return [
            "--disable-blink-features=AutomationControlled",
            "--disable-web-security",
            "--disable-features=IsolateOrigins,site-per-process",
            "--disable-infobars",
            "--disable-background-networking",
            "--disable-dev-shm-usage",
            "--no-first-run",
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-accelerated-2d-canvas",
            "--disable-gpu",
            f"--window-size={width},{height}",
        ]

    def _get_proxy_config(self) -> Optional[dict]:
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
        width = random.randint(1200, 1920)
        height = random.randint(800, 1080)

        context = browser.new_context(
            viewport={"width": width, "height": height},
            user_agent=self.proxy_manager.get_headers()["User-Agent"],
            locale=random.choice(self.LOCALES),
            timezone_id=random.choice(self.TIMEZONES),
            geolocation={
                "latitude": round(random.uniform(47, 55), 4),  # Germany lat range
                "longitude": round(random.uniform(6, 15), 4),  # Germany lon range
            },
            permissions=["geolocation"],
            color_scheme=random.choice(["light", "dark", "no-preference"]),
            java_script_enabled=True,
            bypass_csp=True,
            extra_http_headers={
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        )

        context.add_init_script(self.STEALTH_SCRIPT)
        page = context.new_page()

        # Realistic mouse movement simulation
        page.evaluate(
            """() => {
            let lastX = Math.random() * window.innerWidth;
            let lastY = Math.random() * window.innerHeight;
            const move = () => {
                lastX += (Math.random() - 0.5) * 100;
                lastY += (Math.random() - 0.5) * 100;
                lastX = Math.max(0, Math.min(window.innerWidth, lastX));
                lastY = Math.max(0, Math.min(window.innerHeight, lastY));
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: lastX, clientY: lastY, bubbles: true
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
        from playwright.async_api import async_playwright
        self._pw_context = async_playwright()
        self._playwright = await self._pw_context.start()
        return self

    async def stop(self):
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None

    async def __aenter__(self):
        return await self.start()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    async def new_browser(self):
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
        width = random.randint(1200, 1920)
        height = random.randint(800, 1080)

        context = await browser.new_context(
            viewport={"width": width, "height": height},
            user_agent=self.proxy_manager.get_headers()["User-Agent"],
            locale=random.choice(StealthBrowser.LOCALES),
            timezone_id=random.choice(StealthBrowser.TIMEZONES),
            geolocation={
                "latitude": round(random.uniform(47, 55), 4),
                "longitude": round(random.uniform(6, 15), 4),
            },
            permissions=["geolocation"],
            color_scheme=random.choice(["light", "dark", "no-preference"]),
            java_script_enabled=True,
            bypass_csp=True,
            extra_http_headers={
                "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
            },
        )

        context.add_init_script(StealthBrowser.STEALTH_SCRIPT)
        page = await context.new_page()

        await page.evaluate(
            """() => {
            let lastX = Math.random() * window.innerWidth;
            let lastY = Math.random() * window.innerHeight;
            const move = () => {
                lastX += (Math.random() - 0.5) * 100;
                lastY += (Math.random() - 0.5) * 100;
                lastX = Math.max(0, Math.min(window.innerWidth, lastX));
                lastY = Math.max(0, Math.min(window.innerHeight, lastY));
                window.dispatchEvent(new MouseEvent('mousemove', {
                    clientX: lastX, clientY: lastY, bubbles: true
                }));
                setTimeout(move, Math.random() * 3000 + 1000);
            };
            setTimeout(move, Math.random() * 2000 + 500);
        }"""
        )

        return page
