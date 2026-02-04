'use client';

import { useState } from 'react';
import { Cart } from '@/lib/shopify/types';
import { Button } from '@/components/ui/button';
import { Tag, ChevronRight, CreditCard, Shield } from 'lucide-react';

function formatPrice(amount: string, currencyCode: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function CartSummary({ cart }: { cart: Cart }) {
  const [promoCode, setPromoCode] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const subtotal = parseFloat(cart.cost.subtotalAmount.amount);
  const total = parseFloat(cart.cost.totalAmount.amount);
  const tax = parseFloat(cart.cost.totalTaxAmount?.amount || '0');
  const currencyCode = cart.cost.totalAmount.currencyCode;

  // Calculate shipping (free over $50)
  const shippingThreshold = 50;
  const shipping = subtotal >= shippingThreshold ? 0 : 5.99;
  const amountToFreeShipping = shippingThreshold - subtotal;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setIsApplyingPromo(true);
    // TODO: Implement promo code application via Shopify API
    setTimeout(() => setIsApplyingPromo(false), 1000);
  };

  return (
    <div className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden sticky top-24">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-semibold text-white">Order Summary</h2>
      </div>

      {/* Summary Details */}
      <div className="p-6 space-y-4">
        {/* Free Shipping Progress */}
        {shipping > 0 && (
          <div className="bg-[#ff00b0]/10 rounded-lg p-4 mb-4">
            <p className="text-sm text-white mb-2">
              Add <span className="text-[#ff00b0] font-semibold">{formatPrice(amountToFreeShipping.toString(), currencyCode)}</span> more for free shipping!
            </p>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] rounded-full transition-all"
                style={{ width: `${Math.min((subtotal / shippingThreshold) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Promo Code */}
        <div className="space-y-2">
          <label className="text-sm text-white/60 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Promo Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-[#ff00b0]/50"
            />
            <Button
              onClick={handleApplyPromo}
              disabled={isApplyingPromo || !promoCode.trim()}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              Apply
            </Button>
          </div>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          <div className="flex justify-between text-white/70">
            <span>Subtotal ({cart.totalQuantity} items)</span>
            <span>{formatPrice(subtotal.toString(), currencyCode)}</span>
          </div>
          <div className="flex justify-between text-white/70">
            <span>Shipping</span>
            <span className={shipping === 0 ? 'text-green-400' : ''}>
              {shipping === 0 ? 'FREE' : formatPrice(shipping.toString(), currencyCode)}
            </span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-white/70">
              <span>Tax</span>
              <span>{formatPrice(tax.toString(), currencyCode)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-4 border-t border-white/10">
          <span className="text-lg font-semibold text-white">Total</span>
          <span className="text-2xl font-bold text-white">
            {formatPrice((total + shipping).toString(), currencyCode)}
          </span>
        </div>

        {/* Checkout Button */}
        <a
          href={cart.checkoutUrl}
          className="w-full mt-4 bg-gradient-to-r from-[#ff00b0] to-[#7c3aed] hover:opacity-90 text-white font-semibold py-4 px-6 rounded-full transition-all flex items-center justify-center gap-2 group"
        >
          <CreditCard className="w-5 h-5" />
          Proceed to Checkout
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Payment Methods */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <Shield className="w-4 h-4 text-white/40" />
          <span className="text-xs text-white/40">Secure checkout powered by Shopify</span>
        </div>

        {/* Payment Icons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {['Visa', 'Mastercard', 'Amex', 'PayPal', 'Apple Pay'].map((method) => (
            <div
              key={method}
              className="w-10 h-6 bg-white/10 rounded flex items-center justify-center"
            >
              <span className="text-[8px] text-white/50 font-medium">{method}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
