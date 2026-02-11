"""Data models for scraped product information."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Source(str, Enum):
    SEPHORA = "sephora"
    ULTA = "ulta"
    AMAZON = "amazon"


class Category(str, Enum):
    SKINCARE = "skincare"
    FRAGRANCES = "fragrances"
    HAIRCARE = "haircare"
    NAIL_CARE = "nail_care"
    MOISTURIZERS = "moisturizers"
    SHAMPOO_CONDITIONER = "shampoo_conditioner"
    TONERS = "toners"
    SERUMS = "serums"
    FACE_MASKS = "face_masks"


@dataclass
class PricePoint:
    """A single price observation at a point in time."""

    price: float
    currency: str = "EUR"
    sale_price: Optional[float] = None
    in_stock: bool = True
    scraped_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Product:
    """Represents a competitor product."""

    source: Source
    external_id: str
    name: str
    brand: str
    url: str
    category: Category
    price: PricePoint
    image_url: Optional[str] = None
    description: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    ingredients: Optional[str] = None
    size: Optional[str] = None
    sku: Optional[str] = None
    tags: list[str] = field(default_factory=list)


@dataclass
class ScraperResult:
    """Result of a scraper run."""

    source: Source
    products: list[Product]
    started_at: datetime
    finished_at: datetime
    total_pages: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def success_rate(self) -> float:
        total = len(self.products) + len(self.errors)
        return len(self.products) / total if total > 0 else 0.0

    @property
    def duration_seconds(self) -> float:
        return (self.finished_at - self.started_at).total_seconds()
