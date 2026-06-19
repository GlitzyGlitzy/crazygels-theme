'use client';

import { Suspense, useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin';

  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Invalid token');
        return;
      }

      // Sync token to localStorage so existing per-page API calls keep working
      localStorage.setItem('cg_admin_token', token);
      router.push(redirect);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-light text-[#2C2C2C] mb-1 text-center">Admin Access</h1>
        <p className="text-sm text-[#2C2C2C]/50 text-center mb-8">Crazy Gels internal tools</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E8E4DE] p-8 space-y-4">
          <div>
            <label htmlFor="token" className="block text-xs font-medium text-[#2C2C2C]/60 uppercase tracking-wider mb-2">
              Admin Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter admin token"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#E8E4DE] bg-[#FAF7F2] px-4 py-3 text-sm text-[#2C2C2C] placeholder-[#2C2C2C]/30 focus:outline-none focus:ring-2 focus:ring-[#9E6B73]/30 focus:border-[#9E6B73]"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#2C2C2C] text-[#FAF7F2] py-3 px-6 rounded-lg text-sm font-medium hover:bg-[#1A1A1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAF7F2]" />}>
      <AdminLoginForm />
    </Suspense>
  );
}
