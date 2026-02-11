'use client'

import { useState } from 'react'
import { ShoppingBag, Bell, ThumbsUp, Sparkles, FlaskConical, Star } from 'lucide-react'

interface Recommendation {
  product_hash: string
  display_name: string
  category: string
  price_tier: string
  efficacy_score: number
  key_actives: string[]
  suitable_for?: string[]
  image_url?: string | null
  description?: string | null
  availability: 'in_stock' | 'coming_soon' | 'research'
  fulfillment?: string
  delivery?: string
  votes?: number
}

interface RecommendationData {
  primary: Recommendation[]
  secondary: Recommendation[]
  research: Recommendation[]
  meta?: {
    total_matches: number
    timestamp: string
  }
}

function EfficacyBar({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#9E6B73] transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-[#666666] tabular-nums">{percentage}%</span>
    </div>
  )
}

function ActiveTag({ active }: { active: string }) {
  return (
    <span className="px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase bg-[#F5F3EF] border border-[#E8E4DC] text-[#6B5B4F] rounded-full">
      {active}
    </span>
  )
}

function PriceTierBadge({ tier }: { tier: string }) {
  const config: Record<string, { label: string; style: string }> = {
    budget: { label: 'Budget-Friendly', style: 'bg-[#F5F3EF] text-[#6B5B4F] border-[#E8E4DC]' },
    mid: { label: 'Mid-Range', style: 'bg-[#F5F3EF] text-[#6B5B4F] border-[#E8E4DC]' },
    premium: { label: 'Premium', style: 'bg-[#9E6B73]/10 text-[#9E6B73] border-[#9E6B73]/20' },
    luxury: { label: 'Luxury', style: 'bg-[#B76E79]/10 text-[#B76E79] border-[#B76E79]/20' },
  }
  const { label, style } = config[tier] || config.mid
  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase border rounded-full ${style}`}>
      {label}
    </span>
  )
}

function ProductCard({
  product,
  cta,
  badge,
  badgeStyle,
  icon: Icon,
  disabled,
  onVote,
}: {
  product: Recommendation
  cta: string
  badge: string
  badgeStyle: string
  icon: React.ElementType
  disabled?: boolean
  onVote?: (hash: string) => void
}) {
  return (
    <div
      className={`group relative flex flex-col bg-[#FAFAF8] border border-[#E8E4DC] rounded-2xl overflow-hidden transition-all duration-300 ${
        disabled
          ? 'opacity-80'
          : 'hover:border-[#9E6B73]/40 hover:shadow-lg'
      }`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#F5F3EF] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.display_name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#E8E4DC]">
            <FlaskConical className="w-10 h-10" />
          </div>
        )}
        <span
          className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-medium tracking-wider uppercase rounded-full ${badgeStyle}`}
        >
          <Icon className="w-3 h-3" />
          {badge}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 mb-2 group-hover:text-[#9E6B73] transition-colors">
          {product.display_name}
        </h3>

        {/* Actives */}
        {product.key_actives && product.key_actives.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {product.key_actives.slice(0, 3).map((active) => (
              <ActiveTag key={active} active={active} />
            ))}
          </div>
        )}

        {/* Efficacy */}
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-wider text-[#9B9B9B] mb-1">Efficacy Score</p>
          <EfficacyBar score={product.efficacy_score} />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-4">
          <PriceTierBadge tier={product.price_tier} />
          <span className="text-[10px] text-[#9B9B9B] capitalize">{product.category.replace('-', ' ')}</span>
        </div>

        {/* CTA */}
        <div className="mt-auto">
          {onVote ? (
            <button
              onClick={() => onVote(product.product_hash)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-[#9E6B73] text-[#9E6B73] text-xs font-medium tracking-[0.1em] uppercase rounded-full hover:bg-[#9E6B73] hover:text-white transition-all duration-300"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {cta}
              {product.votes != null && product.votes > 0 && (
                <span className="text-[10px] opacity-60">({product.votes})</span>
              )}
            </button>
          ) : (
            <button
              disabled={disabled}
              className={`w-full py-2.5 text-xs font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-300 ${
                disabled
                  ? 'bg-[#E8E4DC] text-[#9B9B9B] cursor-not-allowed'
                  : 'bg-[#1A1A1A] text-white hover:bg-[#9E6B73]'
              }`}
            >
              {cta}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RecommendationGrid({
  recommendations,
}: {
  recommendations: RecommendationData
}) {
  const [votes, setVotes] = useState<Record<string, number>>({})

  const handleVote = (hash: string) => {
    setVotes((prev) => ({ ...prev, [hash]: (prev[hash] || 0) + 1 }))
  }

  const hasPrimary = recommendations.primary.length > 0
  const hasSecondary = recommendations.secondary.length > 0
  const hasResearch = recommendations.research.length > 0

  if (!hasPrimary && !hasSecondary && !hasResearch) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FlaskConical className="w-12 h-12 text-[#E8E4DC] mb-4" />
        <h3 className="text-lg font-serif text-[#1A1A1A] mb-2">No matches yet</h3>
        <p className="text-sm text-[#666666] max-w-sm">
          Complete the skin analysis to receive personalized product recommendations from our catalog.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-12 md:space-y-16">
      {/* PRIMARY: Available now (listed on Shopify) */}
      {hasPrimary && (
        <section>
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <Star className="w-4 h-4 text-[#9E6B73]" />
              <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase">
                Available Now
              </p>
            </div>
            <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-[#1A1A1A]">
              Matches Your Biology
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              Products from our store matched to your skin profile
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:gap-6">
            {recommendations.primary.map((product) => (
              <ProductCard
                key={product.product_hash}
                product={product}
                cta="Add to Cart"
                badge="In Stock"
                badgeStyle="bg-[#1A1A1A] text-white"
                icon={ShoppingBag}
              />
            ))}
          </div>
        </section>
      )}

      {/* SECONDARY: Coming soon (sampled, testing) */}
      {hasSecondary && (
        <section>
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-[#B76E79]" />
              <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#B76E79] uppercase">
                Coming to Crazy Gels
              </p>
            </div>
            <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-[#1A1A1A]">
              Currently Testing
            </h2>
            <p className="text-sm text-[#666666] mt-1">
              We are sampling these products and they will be available soon
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-5 lg:gap-6">
            {recommendations.secondary.map((product) => (
              <ProductCard
                key={product.product_hash}
                product={product}
                cta="Notify Me"
                badge="Testing Now"
                badgeStyle="bg-[#B76E79] text-white"
                icon={Bell}
                disabled
              />
            ))}
          </div>
        </section>
      )}

      {/* RESEARCH: Community vote to stock */}
      {hasResearch && (
        <section>
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-2 mb-1.5">
              <FlaskConical className="w-4 h-4 text-[#6B5B4F]" />
              <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#6B5B4F] uppercase">
                Community Selection
              </p>
            </div>
            <h2 className="font-serif text-xl md:text-2xl lg:text-3xl font-light tracking-tight text-[#1A1A1A]">
              Vote to Stock
            </h2>
            <p className="text-sm text-[#666666] mt-1 max-w-lg">
              Our intelligence engine identified these as optimal matches for your biology. Vote to fast-track them to our store.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:gap-6">
            {recommendations.research.map((product) => (
              <ProductCard
                key={product.product_hash}
                product={{ ...product, votes: (product.votes || 0) + (votes[product.product_hash] || 0) }}
                cta="Vote to Stock"
                badge="Research"
                badgeStyle="bg-[#6B5B4F] text-white"
                icon={FlaskConical}
                onVote={handleVote}
              />
            ))}
          </div>
        </section>
      )}

      {/* Metadata */}
      {recommendations.meta && (
        <div className="border-t border-[#E8E4DC] pt-4">
          <p className="text-[10px] text-[#9B9B9B] tracking-wider">
            {recommendations.meta.total_matches} products analyzed &middot; Last updated{' '}
            {new Date(recommendations.meta.timestamp).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      )}
    </div>
  )
}
