import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCart } from '@/lib/shopify/actions';
import { isShopifyConfigured } from '@/lib/shopify';
import { CartContents } from '@/components/cart/cart-contents';
import { CartSummary } from '@/components/cart/cart-summary';
import { Footer } from '@/components/layout/footer';
import { ChevronLeft, ShoppingBag, Lock, Truck, RotateCcw } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shopping Cart | Crazy Gels',
  description: 'Review your cart and proceed to checkout.',
};

function CartSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-xl">
            <div className="w-24 h-24 bg-white/10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/10 rounded w-1/2" />
              <div className="h-4 bg-white/10 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-[#D4AF37]" />
        </div>
        <h2 className="text-2xl font-medium text-[#2C2C2C] mb-3">Your cart is empty</h2>
        <p className="text-[#2C2C2C]/60 mb-8">
          Looks like you haven&apos;t added any items to your cart yet. Start shopping to fill it up!
        </p>
        <Link
          href="/collections"
          className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#B8860B] text-white font-medium py-3 px-8 rounded-full transition-all"
        >
          Start Shopping
        </Link>
      </div>
    </div>
  );
}

function ShopifyNotConfigured() {
  return (
    <div className="text-center py-16 px-4">
      <div className="max-w-md mx-auto bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl p-8">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37]/20 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
        </div>
        <h3 className="text-[#2C2C2C] font-medium text-lg mb-2">Cart Not Available</h3>
        <p className="text-[#2C2C2C]/60 text-sm mb-4">
          Connect your Shopify store to enable the shopping cart.
        </p>
        <div className="text-left bg-[#FAF7F2] rounded-lg p-4 text-xs font-mono">
          <p className="text-[#2C2C2C]/40 mb-1">Required environment variables:</p>
          <p className="text-[#B8860B]">SHOPIFY_STORE_DOMAIN</p>
          <p className="text-[#B8860B]">SHOPIFY_STOREFRONT_ACCESS_TOKEN</p>
        </div>
      </div>
    </div>
  );
}

async function CartContent() {
  if (!isShopifyConfigured) {
    return <ShopifyNotConfigured />;
  }

  const cart = await fetchCart();

  if (!cart || cart.totalQuantity === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2">
        <div className="bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#D4AF37]/10">
            <h2 className="text-lg font-semibold text-[#2C2C2C]">
              Cart Items ({cart.totalQuantity})
            </h2>
          </div>
          <CartContents cart={cart} />
        </div>
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <CartSummary cart={cart} />
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="border-b border-[#D4AF37]/20 bg-[#FAF7F2]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-[#2C2C2C]/60 hover:text-[#D4AF37] transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span>Continue Shopping</span>
            </Link>
            <Link href="/" className="text-2xl font-light tracking-[0.2em]">
              <span className="text-[#2C2C2C]">CRAZY </span>
              <span className="font-medium text-[#D4AF37]">GELS</span>
            </Link>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-light tracking-tight text-[#2C2C2C] mb-2">Shopping Cart</h1>
          <p className="text-[#2C2C2C]/60">Review your items before checkout</p>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex items-center gap-3 p-4 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#2C2C2C] font-medium text-sm">Secure Checkout</p>
              <p className="text-[#2C2C2C]/50 text-xs">SSL Encrypted</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#2C2C2C] font-medium text-sm">Free Shipping</p>
              <p className="text-[#2C2C2C]/50 text-xs">Orders over $50</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-[#FFFEF9] border border-[#D4AF37]/20 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-[#2C2C2C] font-medium text-sm">Easy Returns</p>
              <p className="text-[#2C2C2C]/50 text-xs">30-day policy</p>
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <Suspense fallback={<CartSkeleton />}>
          <CartContent />
        </Suspense>
      </main>
      
      <Footer />
    </div>
  );
}
