'use client';

import { useState, useTransition } from 'react';
import { klaviyoIdentify } from '@/lib/klaviyo-client';

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

        // Also identify via client-side Klaviyo for immediate tracking
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
      <div className="flex items-center gap-3 rounded-full bg-white/5 border border-[#B76E79]/30 px-6 py-4 w-full sm:w-auto">
        <svg className="h-5 w-5 text-[#B76E79] shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
        <span className="text-[#FAF7F2] text-sm">
          Welcome to the inner circle! Check your inbox.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full lg:w-auto">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto"
        aria-label="Newsletter signup"
      >
        <label htmlFor="footer-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === 'error') setStatus('idle');
          }}
          placeholder="Enter your email"
          required
          disabled={isPending}
          className="px-6 py-4 bg-white/5 border border-[#B76E79]/30 rounded-full text-[#FAF7F2] placeholder:text-[#FAF7F2]/40 focus:outline-none focus:border-[#B76E79] focus:ring-2 focus:ring-[#B76E79]/20 transition-colors w-full sm:w-80 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-8 py-4 bg-[#B76E79] text-[#2C2C2C] font-medium tracking-wide rounded-full hover:bg-[#A15D67] transition-colors focus:outline-none focus:ring-2 focus:ring-[#B76E79]/50 disabled:opacity-60"
        >
          {isPending ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
        </button>
      </form>
      {status === 'error' && (
        <p className="mt-2 text-sm text-red-400" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
