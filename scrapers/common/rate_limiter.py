"""Async rate limiter using a semaphore for concurrent request control."""

import asyncio


class RateLimiter:
    """Controls concurrent request count using an async semaphore."""

    def __init__(self, max_concurrent: int = 3):
        self._semaphore = asyncio.Semaphore(max_concurrent)

    async def __aenter__(self):
        await self._semaphore.acquire()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self._semaphore.release()
