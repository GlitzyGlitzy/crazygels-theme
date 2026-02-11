"""
Stealth proxy manager with rotating residential/datacenter proxies.

Supports:
  - Environment-based proxy configuration (PROXY_LIST, HTTP_PROXY)
  - AWS Secrets Manager for production proxy credentials
  - Automatic rotation with health tracking (success/fail scoring)
  - Realistic browser header generation for anti-detection

Environment variables:
  PROXY_LIST          Comma-separated proxy URLs
                      e.g. "http://user:pass@proxy1:8080,http://user:pass@proxy2:8080"
  HTTP_PROXY          Single fallback proxy URL
  PROXY_SECRET_ARN    AWS Secrets Manager ARN containing proxy credentials
  AWS_REGION          AWS region for Secrets Manager (default: eu-central-1)
"""

import json
import logging
import os
import random
import time
from typing import Optional
from urllib.parse import urlparse

from scrapers.common.user_agents import get_random_user_agent

logger = logging.getLogger(__name__)

# Minimum score before a proxy is temporarily removed from rotation
_MIN_HEALTH_SCORE = 0.2
# Seconds to wait before retrying a failed proxy
_COOLDOWN_SECONDS = 300


class _ProxyEntry:
    """Internal tracking for a single proxy endpoint."""

    __slots__ = ("url", "successes", "failures", "last_failure_at")

    def __init__(self, url: str):
        self.url = url
        self.successes: int = 0
        self.failures: int = 0
        self.last_failure_at: float = 0.0

    @property
    def score(self) -> float:
        total = self.successes + self.failures
        if total == 0:
            return 1.0  # Untested proxies get full score
        return self.successes / total

    @property
    def is_cooled_down(self) -> bool:
        if self.last_failure_at == 0.0:
            return True
        return (time.time() - self.last_failure_at) >= _COOLDOWN_SECONDS

    def record_success(self):
        self.successes += 1

    def record_failure(self):
        self.failures += 1
        self.last_failure_at = time.time()


class StealthProxyManager:
    """Manages a pool of rotating proxies with health-based selection.

    Usage:
        manager = StealthProxyManager(use_aws_secrets=False)

        # For aiohttp requests
        headers = manager.get_headers()
        proxy_url = manager.get_proxy_url()

        # For Playwright browser contexts
        proxy_dict = manager.get_proxy()  # {"http": "http://..."}

        # Report outcomes to influence rotation
        manager.report_success(proxy_url)
        manager.report_failure(proxy_url)
    """

    # Realistic Accept / Accept-Language / Sec-* headers that rotate
    _ACCEPT_HEADERS = [
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    ]

    _ACCEPT_LANG = [
        "en-US,en;q=0.9",
        "en-US,en;q=0.9,de;q=0.8",
        "en-GB,en;q=0.9,en-US;q=0.8",
        "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        "en-US,en;q=0.9,fr;q=0.8",
    ]

    _SEC_CH_UA = [
        '"Chromium";v="134", "Google Chrome";v="134", "Not-A.Brand";v="8"',
        '"Chromium";v="133", "Google Chrome";v="133", "Not-A.Brand";v="8"',
        '"Chromium";v="134", "Microsoft Edge";v="134", "Not-A.Brand";v="8"',
    ]

    _PLATFORMS = [
        '"Windows"',
        '"macOS"',
        '"Linux"',
    ]

    def __init__(self, use_aws_secrets: bool = True):
        self._proxies: list[_ProxyEntry] = []
        self._url_to_entry: dict[str, _ProxyEntry] = {}

        # Load proxies from env first
        self._load_env_proxies()

        # Optionally load from AWS Secrets Manager
        if use_aws_secrets and not self._proxies:
            self._load_aws_proxies()

        if self._proxies:
            logger.info(f"Proxy pool initialised with {len(self._proxies)} proxies")
        else:
            logger.info("No proxies configured -- requests will use direct connection")

    # ── Proxy loading ────────────────────────────────────────────

    def _load_env_proxies(self):
        """Load proxies from PROXY_LIST or HTTP_PROXY environment variables."""
        proxy_list = os.environ.get("PROXY_LIST", "")
        if proxy_list:
            for url in proxy_list.split(","):
                url = url.strip()
                if url:
                    self._add_proxy(url)
            return

        # Single proxy fallback
        single = os.environ.get("HTTP_PROXY", "") or os.environ.get("HTTPS_PROXY", "")
        if single:
            self._add_proxy(single.strip())

    def _load_aws_proxies(self):
        """Load proxy credentials from AWS Secrets Manager."""
        secret_arn = os.environ.get("PROXY_SECRET_ARN")
        if not secret_arn:
            return

        try:
            import boto3

            region = os.environ.get("AWS_REGION", "eu-central-1")
            client = boto3.client("secretsmanager", region_name=region)
            response = client.get_secret_value(SecretId=secret_arn)
            secret = json.loads(response["SecretString"])

            # Support both list format and structured format
            if isinstance(secret, list):
                for url in secret:
                    self._add_proxy(url)
            elif isinstance(secret, dict):
                # Expect {"proxies": ["http://...", ...]} or
                # {"host": "...", "port": ..., "username": "...", "password": "..."}
                if "proxies" in secret:
                    for url in secret["proxies"]:
                        self._add_proxy(url)
                elif "host" in secret:
                    scheme = secret.get("scheme", "http")
                    host = secret["host"]
                    port = secret.get("port", 8080)
                    user = secret.get("username", "")
                    pw = secret.get("password", "")
                    auth = f"{user}:{pw}@" if user else ""
                    self._add_proxy(f"{scheme}://{auth}{host}:{port}")

            logger.info(f"Loaded {len(self._proxies)} proxies from Secrets Manager")
        except Exception as e:
            logger.warning(f"Could not load proxies from Secrets Manager: {e}")

    def _add_proxy(self, url: str):
        """Add a proxy URL to the pool."""
        if url not in self._url_to_entry:
            entry = _ProxyEntry(url)
            self._proxies.append(entry)
            self._url_to_entry[url] = entry

    # ── Public API ────────────────────────────────────────────────

    def get_headers(self) -> dict[str, str]:
        """Generate realistic browser request headers.

        Rotates User-Agent, Accept, Accept-Language, and Sec-CH-UA
        headers to reduce fingerprinting detection.
        """
        ua = get_random_user_agent()
        platform = random.choice(self._PLATFORMS)
        mobile = "?0"

        headers = {
            "User-Agent": ua,
            "Accept": random.choice(self._ACCEPT_HEADERS),
            "Accept-Language": random.choice(self._ACCEPT_LANG),
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

        # Only add Sec-CH-UA for Chrome-like UAs
        if "Chrome" in ua:
            headers["Sec-CH-UA"] = random.choice(self._SEC_CH_UA)
            headers["Sec-CH-UA-Mobile"] = mobile
            headers["Sec-CH-UA-Platform"] = platform

        return headers

    def get_proxy_url(self) -> Optional[str]:
        """Get a healthy proxy URL for aiohttp / requests.

        Returns None if no proxies are configured or all are unhealthy.
        Selects based on weighted random using health scores.
        """
        candidates = [
            p for p in self._proxies
            if p.score >= _MIN_HEALTH_SCORE and p.is_cooled_down
        ]

        if not candidates:
            # If all proxies are in cooldown, try any that have cooled down
            candidates = [p for p in self._proxies if p.is_cooled_down]

        if not candidates:
            return None

        # Weighted random selection based on health score
        weights = [max(p.score, 0.1) for p in candidates]
        selected = random.choices(candidates, weights=weights, k=1)[0]
        return selected.url

    def get_proxy(self) -> Optional[dict[str, str]]:
        """Get proxy config dict for Playwright / requests.

        Returns {"http": "http://...", "https": "http://..."} or None.
        """
        url = self.get_proxy_url()
        if not url:
            return None
        return {"http": url, "https": url}

    def report_success(self, proxy_url: str):
        """Report a successful request through a proxy."""
        entry = self._url_to_entry.get(proxy_url)
        if entry:
            entry.record_success()

    def report_failure(self, proxy_url: str):
        """Report a failed request through a proxy."""
        entry = self._url_to_entry.get(proxy_url)
        if entry:
            entry.record_failure()
            if entry.score < _MIN_HEALTH_SCORE:
                logger.warning(
                    f"Proxy {_mask_url(proxy_url)} health dropped to "
                    f"{entry.score:.0%}, entering cooldown"
                )

    @property
    def pool_size(self) -> int:
        """Number of proxies in the pool."""
        return len(self._proxies)

    @property
    def healthy_count(self) -> int:
        """Number of proxies above minimum health threshold."""
        return sum(
            1 for p in self._proxies
            if p.score >= _MIN_HEALTH_SCORE and p.is_cooled_down
        )

    def get_pool_stats(self) -> dict:
        """Return pool health statistics for monitoring."""
        return {
            "total": self.pool_size,
            "healthy": self.healthy_count,
            "proxies": [
                {
                    "url": _mask_url(p.url),
                    "score": round(p.score, 2),
                    "successes": p.successes,
                    "failures": p.failures,
                    "cooled_down": p.is_cooled_down,
                }
                for p in self._proxies
            ],
        }


def _mask_url(url: str) -> str:
    """Mask proxy URL credentials for safe logging."""
    try:
        parsed = urlparse(url)
        if parsed.username:
            masked_user = parsed.username[:2] + "***"
            return url.replace(
                f"{parsed.username}:{parsed.password}@",
                f"{masked_user}:***@",
            )
    except Exception:
        pass
    return url[:30] + "..."
