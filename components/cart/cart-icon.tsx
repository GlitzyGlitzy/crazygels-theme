'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function CartIcon({ count = 0 }: { count?: number }) {
  return (
    <Link 
      href="/cart" 
      className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      aria-label={`Shopping cart with ${count} items`}
    >
      <ShoppingBag className="w-5 h-5 text-white" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#B76E79] rounded-full flex items-center justify-center text-xs font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
