'use client';

import { useState, useTransition } from 'react';
import { klaviyoIdentify } from '@/lib/klaviyo-client';
import { Gift, Sparkles, Mail } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/klaviyo/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), source: 'website-footer' }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Subscription failed');
        }

        klaviyoIdentify({ email: email.trim() });
        setStatus('success');
        setEmail('');
      } catch (err) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  if (status === 'success') {
    return (
      <div className="w-full max-w-xl mx-auto text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#B76E79]/20 mb-4">
          <svg className="h-7 w-7 text-[#B76E79]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#FAF7F2] mb-1">
          {"You're in!"}
        </h3>
        <p className="text-[#FAF7F2]/60 text-sm">
          Welcome to the Crazy Gels inner circle. Your exclusive welcome offer is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto text-center lg:text-left">
      {/* Perks */}
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 mb-5">
        {[
          { icon: Gift, text: '10% off your first order' },
          { icon: Sparkles, text: 'Early access to new drops' },
          { icon: Mail, text: 'Weekly beauty tips' },
        ].map((perk) => (
          <span key={perk.text} className="inline-flex items-center gap-1.5 text-[#FAF7F2]/60 text-xs tracking-wide">
            <perk.icon className="w-3.5 h-3.5 text-[#B76E79]" aria-hidden="true" />
            {perk.text}
          </span>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
        aria-label="Newsletter signup"
      >
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="relative flex-1">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#FAF7F2]/30 pointer-events-none" aria-hidden="true" />
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="Your email address"
            required
            disabled={isPending}
            className="w-full pl-10 pr-5 py-3.5 bg-white/[0.07] border border-[#B76E79]/25 rounded-full text-[#FAF7F2] text-sm placeholder:text-[#FAF7F2]/35 focus:outline-none focus:border-[#B76E79] focus:ring-2 focus:ring-[#B76E79]/20 focus:bg-white/[0.1] transition-all disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="px-7 py-3.5 bg-[#B76E79] text-white text-sm font-medium tracking-wider rounded-full hover:bg-[#A15D67] active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-[#B76E79]/50 focus:ring-offset-2 focus:ring-offset-[#2C2C2C] disabled:opacity-50 whitespace-nowrap"
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              JOINING...
            </span>
          ) : (
            'JOIN THE CLUB'
          )}
        </button>
      </form>

      {/* Error */}
      {status === 'error' && (
        <p className="mt-2.5 text-xs text-red-400/90 text-center sm:text-left" role="alert">
          {errorMsg}
        </p>
      )}

      {/* Privacy note */}
      <p className="mt-3 text-[10px] text-[#FAF7F2]/30 tracking-wide">
        No spam, ever. Unsubscribe anytime.
      </p>
    </div>
  );
}
