'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Sparkles, FlaskConical } from 'lucide-react';
import RecommendationGrid from '@/components/recommendations/recommendation-grid';
import { DynamicHeader } from '@/components/layout/dynamic-header';
import { Footer } from '@/components/layout/footer';

interface RecommendationData {
  primary: any[];
  secondary: any[];
  research: any[];
  meta?: {
    total_matches: number;
    timestamp: string;
  };
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState<string>('');

  const concerns = [
    'acne', 'aging', 'dehydration', 'hyperpigmentation', 'sensitivity',
    'redness', 'oily skin', 'dark spots', 'fine lines', 'dullness',
    'uneven texture', 'large pores',
  ];

  const toggleConcern = (concern: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern)
        ? prev.filter((c) => c !== concern)
        : [...prev, concern]
    );
  };

  const handleSearch = async () => {
    if (selectedConcerns.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skinProfile: {
            concerns: selectedConcerns,
            sensitivities: [],
            ...(priceTier && { priceTier }),
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <DynamicHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/consult"
            className="inline-flex items-center gap-2 text-sm text-[#666666] hover:text-[#9E6B73] transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Consult
          </Link>
          <div className="flex items-center gap-2 mb-1.5">
            <FlaskConical className="w-4 h-4 text-[#9E6B73]" />
            <p className="text-[10px] md:text-[11px] font-medium tracking-[0.3em] text-[#9E6B73] uppercase">
              Product Intelligence
            </p>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light tracking-tight text-[#1A1A1A]">
            Personalized Recommendations
          </h1>
          <p className="text-sm text-[#666666] mt-2 max-w-xl">
            Select your skin concerns below to see products matched across our store,
            upcoming samples, and community-voted research picks.
          </p>
        </div>

        {/* Concern Picker */}
        <section className="mb-10">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B] mb-3">
            Your concerns
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {concerns.map((concern) => (
              <button
                key={concern}
                onClick={() => toggleConcern(concern)}
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider capitalize transition-all ${
                  selectedConcerns.includes(concern)
                    ? 'bg-[#1A1A1A] text-white'
                    : 'border border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73] hover:text-[#9E6B73]'
                }`}
              >
                {concern}
              </button>
            ))}
          </div>

          {/* Price tier filter */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#9B9B9B]">
              Price range
            </p>
            <div className="flex gap-2">
              {['', 'budget', 'mid', 'premium', 'luxury'].map((tier) => (
                <button
                  key={tier}
                  onClick={() => setPriceTier(tier)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all ${
                    priceTier === tier
                      ? 'bg-[#9E6B73] text-white'
                      : 'border border-[#E8E4DC] text-[#6B5B4F] hover:border-[#9E6B73]'
                  }`}
                >
                  {tier || 'All'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={selectedConcerns.length === 0 || loading}
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#1A1A1A] text-white text-xs font-medium tracking-[0.15em] uppercase rounded-full hover:bg-[#9E6B73] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Find My Matches
              </>
            )}
          </button>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-8 rounded-xl border border-[#B76E79]/30 bg-[#B76E79]/5 px-5 py-4">
            <p className="text-sm text-[#B76E79]">{error}</p>
          </div>
        )}

        {/* Results */}
        {recommendations && (
          <RecommendationGrid recommendations={recommendations} />
        )}
      </main>

      <Footer />
    </div>
  );
}
