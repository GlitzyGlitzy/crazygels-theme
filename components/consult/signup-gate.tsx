'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2, Shield, Mail } from 'lucide-react';
import { klaviyoIdentify } from '@/lib/klaviyo-client';

const STORAGE_KEY = 'cg_consult_signup';

interface SignupData {
  email: string;
  firstName?: string;
  signedUpAt: string;
}

function getStoredSignup(): SignupData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SignupData;
    // Validate shape
    if (data.email && data.signedUpAt) return data;
    return null;
  } catch {
    return null;
  }
}

function storeSignup(data: SignupData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or disabled -- not critical
  }
}

interface SignupGateProps {
  consultType: 'skin' | 'hair';
  children: React.ReactNode;
}

export function SignupGate({ consultType, children }: SignupGateProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check for existing signup on mount
  useEffect(() => {
    const existing = getStoredSignup();
    if (existing) {
      setIsVerified(true);
      // Re-identify in Klaviyo
      klaviyoIdentify({ email: existing.email, firstName: existing.firstName });
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/klaviyo/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmedEmail,
          firstName: firstName.trim() || undefined,
          source: `ai-consult-${consultType}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Subscription failed');
      }

      // Identify in Klaviyo client-side for tracking
      klaviyoIdentify({ email: trimmedEmail, firstName: firstName.trim() || undefined });

      // Track the consult start event
      if (typeof window !== 'undefined' && window._learnq) {
        window._learnq.push([
          'track',
          'Started AI Consultation',
          {
            ConsultType: consultType,
            Source: `ai-consult-${consultType}`,
          },
        ]);
      }

      // Store for session persistence
      const signupData: SignupData = {
        email: trimmedEmail,
        firstName: firstName.trim() || undefined,
        signedUpAt: new Date().toISOString(),
      };
      storeSignup(signupData);
      setIsVerified(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Still checking sessionStorage
  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#B76E79] animate-spin" />
      </div>
    );
  }

  // Already signed up -- show the AI chat
  if (isVerified) {
    return <>{children}</>;
  }

  // Signup gate
  const accentColor = consultType === 'skin' ? '#9E6B73' : '#6B5B4F';
  const accentColorLight = consultType === 'skin' ? '#B76E79' : '#8A7B6F';
  const title = consultType === 'skin' ? 'Skin Analysis' : 'Hair Analysis';
  const subtitle = consultType === 'skin'
    ? 'Get a personalized skincare routine based on your unique skin type and concerns.'
    : 'Discover the perfect hair care routine tailored to your hair type and goals.';

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      {/* Decorative top bar */}
      <div className="h-1" style={{ background: `linear-gradient(to right, ${accentColor}, ${accentColorLight})` }} />

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo / Icon */}
          <div className="text-center mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${accentColor}10` }}
            >
              <Sparkles className="w-10 h-10" style={{ color: accentColor }} />
            </div>

            <h1 className="text-2xl md:text-3xl font-serif text-[#1A1A1A] mb-2 text-balance">
              Free AI {title}
            </h1>
            <p className="text-[#666666] text-sm leading-relaxed max-w-sm mx-auto">
              {subtitle}
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white border border-[#E8E4DC] rounded-2xl p-6 space-y-4 shadow-sm">
              <div>
                <label htmlFor="signup-email" className="block text-xs font-medium text-[#1A1A1A]/70 uppercase tracking-wider mb-2">
                  Email address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9B9B]" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="your@email.com"
                    className="w-full bg-[#FAFAF8] border border-[#E8E4DC] rounded-xl pl-11 pr-4 py-3 text-[#1A1A1A] text-sm placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#B76E79]/50 transition-colors"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-name" className="block text-xs font-medium text-[#1A1A1A]/70 uppercase tracking-wider mb-2">
                  First name <span className="text-[#9B9B9B] normal-case tracking-normal">(optional)</span>
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Sarah"
                  className="w-full bg-[#FAFAF8] border border-[#E8E4DC] rounded-xl px-4 py-3 text-[#1A1A1A] text-sm placeholder:text-[#9B9B9B] focus:outline-none focus:border-[#B76E79]/50 transition-colors"
                  autoComplete="given-name"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center px-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full flex items-center justify-center gap-2 text-white font-medium py-3.5 px-6 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: accentColor }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColorLight)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing up...
                </>
              ) : (
                <>
                  Start My Free {title}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust signals */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[#9B9B9B]">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-[11px]">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: 'AI-Powered', desc: 'Personalized analysis' },
              { label: 'Instant', desc: 'Results in minutes' },
              { label: 'Free', desc: 'No obligation' },
            ].map((b) => (
              <div key={b.label} className="text-center">
                <p className="text-xs font-medium text-[#1A1A1A]">{b.label}</p>
                <p className="text-[10px] text-[#9B9B9B]">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
