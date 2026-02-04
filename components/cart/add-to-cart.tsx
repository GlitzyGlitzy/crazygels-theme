'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/shopify/types';
import { addItemToCart } from '@/lib/shopify/actions';

export function AddToCart({
  product,
  variant,
  className,
}: {
  product: Product;
  variant: ProductVariant;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = () => {
    startTransition(async () => {
      await addItemToCart(variant.id, 1);
    });
  };

  const isAvailable = variant.availableForSale;

  return (
    <Button
      onClick={handleAddToCart}
      disabled={isPending || !isAvailable}
      className={className}
      aria-label={isAvailable ? 'Add to cart' : 'Out of stock'}
    >
      {isPending ? (
        <span className="animate-pulse">Adding...</span>
      ) : isAvailable ? (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      ) : (
        'Out of Stock'
      )}
    </Button>
  );
}
