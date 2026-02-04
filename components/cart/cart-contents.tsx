'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Cart } from '@/lib/shopify/types';
import { removeItemFromCart, updateItemQuantity } from '@/lib/shopify/actions';
import { Plus, Minus, Trash2, Loader2 } from 'lucide-react';

function formatPrice(amount: string, currencyCode: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

function CartLineItem({ 
  item, 
  onRemove, 
  onUpdateQuantity,
  isUpdating 
}: { 
  item: Cart['lines']['edges'][0]['node'];
  onRemove: (lineId: string) => void;
  onUpdateQuantity: (lineId: string, quantity: number) => void;
  isUpdating: boolean;
}) {
  const product = item.merchandise.product;
  const selectedOptions = item.merchandise.selectedOptions;
  
  return (
    <div className="flex gap-4 p-4 border-b border-white/5 last:border-b-0">
      {/* Product Image */}
      <Link 
        href={`/products/${product.handle}`}
        className="relative w-24 h-24 bg-white/5 rounded-lg overflow-hidden flex-shrink-0 group"
      >
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText || product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            No image
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link 
          href={`/products/${product.handle}`}
          className="text-white font-medium hover:text-[#ff00b0] transition-colors line-clamp-2"
        >
          {product.title}
        </Link>
        
        {/* Variant Options */}
        {selectedOptions && selectedOptions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {selectedOptions.map((option) => (
              <span 
                key={option.name} 
                className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded"
              >
                {option.name}: {option.value}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <p className="mt-2 text-[#ff00b0] font-semibold">
          {formatPrice(item.cost.totalAmount.amount, item.cost.totalAmount.currencyCode)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-col items-end justify-between">
        <button
          onClick={() => onRemove(item.id)}
          disabled={isUpdating}
          className="p-2 text-white/40 hover:text-red-400 transition-colors disabled:opacity-50"
          aria-label="Remove item"
        >
          {isUpdating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            disabled={isUpdating || item.quantity <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4 text-white/70" />
          </button>
          <span className="w-8 text-center text-white font-medium">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            disabled={isUpdating}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function CartContents({ cart }: { cart: Cart }) {
  const [isPending, startTransition] = useTransition();
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

  const handleRemove = (lineId: string) => {
    setUpdatingLineId(lineId);
    startTransition(async () => {
      try {
        await removeItemFromCart(lineId);
      } catch (error) {
        console.error('Failed to remove item:', error);
      } finally {
        setUpdatingLineId(null);
      }
    });
  };

  const handleUpdateQuantity = (lineId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemove(lineId);
      return;
    }

    setUpdatingLineId(lineId);
    startTransition(async () => {
      try {
        await updateItemQuantity(lineId, quantity);
      } catch (error) {
        console.error('Failed to update quantity:', error);
      } finally {
        setUpdatingLineId(null);
      }
    });
  };

  if (!cart.lines.edges || cart.lines.edges.length === 0) {
    return (
      <div className="p-8 text-center text-white/60">
        No items in your cart
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5">
      {cart.lines.edges.map((edge) => (
        <CartLineItem
          key={edge.node.id}
          item={edge.node}
          onRemove={handleRemove}
          onUpdateQuantity={handleUpdateQuantity}
          isUpdating={isPending && updatingLineId === edge.node.id}
        />
      ))}
    </div>
  );
}
