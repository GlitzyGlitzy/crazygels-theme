'use client';

import { useState } from 'react';
import { Star, ChevronDown, BadgeCheck } from 'lucide-react';

interface Review {
  id: number;
  title: string;
  body: string;
  rating: number;
  reviewer: { name: string };
  created_at: string;
  verified: string;
}

interface ProductReviewsProps {
  reviews: Review[];
  rating: number;
  reviewCount: number;
  productTitle: string;
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(rating);
        return (
          <Star
            key={star}
            size={size}
            className={filled ? 'text-[#B76E79] fill-[#B76E79]' : 'text-[#E8E4DC]'}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-right text-[#6B5B4F] font-medium">{stars}</span>
      <Star size={12} className="text-[#B76E79] fill-[#B76E79]" aria-hidden="true" />
      <div className="flex-1 h-2 bg-[#F0ECE6] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#B76E79] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-[#8A7B6F] text-xs">{count}</span>
    </div>
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function ProductReviews({ reviews, rating, reviewCount, productTitle }: ProductReviewsProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  // Calculate star distribution
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  if (reviewCount === 0) {
    return (
      <section id="reviews" className="py-10 border-t border-[#E8E4DC]">
        <h2 className="text-xl font-serif text-[#2C2420] mb-4">Customer Reviews</h2>
        <div className="bg-[#FAF8F5] rounded-xl p-8 text-center">
          <div className="flex justify-center mb-3">
            <StarRating rating={0} size={20} />
          </div>
          <p className="text-[#8A7B6F] text-sm">
            No reviews yet for {productTitle}. Be the first to share your experience!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="reviews" className="py-10 border-t border-[#E8E4DC]">
      <h2 className="text-xl font-serif text-[#2C2420] mb-6">
        Customer Reviews
        <span className="text-sm font-sans text-[#8A7B6F] ml-2">({reviewCount})</span>
      </h2>

      {/* Summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8 bg-[#FAF8F5] rounded-xl p-6">
        {/* Overall rating */}
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <span className="text-4xl font-serif text-[#2C2420]">{rating.toFixed(1)}</span>
          <StarRating rating={rating} size={18} />
          <span className="text-xs text-[#8A7B6F] mt-1">{reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
        </div>

        {/* Distribution */}
        <div className="flex-1 flex flex-col gap-1.5">
          {distribution.map(({ stars, count }) => (
            <RatingBar key={stars} stars={stars} count={count} total={reviewCount} />
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="flex flex-col gap-5">
        {visibleReviews.map((review) => (
          <article key={review.id} className="bg-white rounded-xl border border-[#E8E4DC] p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StarRating rating={review.rating} size={14} />
                  {review.verified === 'buyer' && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-[#6B8F71] font-medium">
                      <BadgeCheck size={12} />
                      Verified
                    </span>
                  )}
                </div>
                {review.title && (
                  <h3 className="text-sm font-medium text-[#2C2420]">{review.title}</h3>
                )}
              </div>
              <span className="text-xs text-[#8A7B6F] whitespace-nowrap">{formatDate(review.created_at)}</span>
            </div>

            {review.body && (
              <p className="text-sm text-[#6B5B4F] leading-relaxed">{review.body}</p>
            )}

            <div className="mt-3 text-xs text-[#8A7B6F]">
              {review.reviewer?.name || 'Anonymous'}
            </div>
          </article>
        ))}
      </div>

      {/* Show more */}
      {reviews.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-6 mx-auto flex items-center gap-1.5 text-sm font-medium text-[#9E6B73] hover:text-[#B76E79] transition-colors"
        >
          Show all {reviews.length} reviews
          <ChevronDown size={16} />
        </button>
      )}
    </section>
  );
}

/**
 * Small inline star badge for product cards / product info header.
 */
export function ReviewStarBadge({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null;

  return (
    <a
      href="#reviews"
      className="inline-flex items-center gap-1.5 group"
      aria-label={`${rating.toFixed(1)} stars from ${count} reviews`}
    >
      <StarRating rating={rating} size={14} />
      <span className="text-xs text-[#8A7B6F] group-hover:text-[#6B5B4F] transition-colors">
        ({count})
      </span>
    </a>
  );
}
