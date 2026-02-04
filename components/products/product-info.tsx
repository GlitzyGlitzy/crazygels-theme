'use client';

import { useState, useTransition } from 'react';
import { Product, ProductVariant } from '@/lib/shopify/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, Minus, ShoppingBag, Heart, Share2, Check } from 'lucide-react';
import { addItemToCart } from '@/lib/shopify/actions';

function formatPrice(amount: string, currencyCode: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(parseFloat(amount));
}

export function ProductInfo({ product }: { product: Product }) {
  const variants = product.variants.edges.map((edge) => edge.node);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isAdded, setIsAdded] = useState(false);

  const hasMultipleVariants = variants.length > 1;
  const isOnSale = selectedVariant.compareAtPrice !== undefined && selectedVariant.compareAtPrice !== null;
  const isAvailable = selectedVariant.availableForSale;

  // Group options by name
  const optionGroups = product.options.reduce((acc, option) => {
    acc[option.name] = option.values;
    return acc;
  }, {} as Record<string, string[]>);

  // Get selected option values
  const selectedOptions = selectedVariant.selectedOptions.reduce((acc, opt) => {
    acc[opt.name] = opt.value;
    return acc;
  }, {} as Record<string, string>);

  // Find variant by selected options
  const findVariant = (optionName: string, value: string) => {
    const newSelectedOptions = { ...selectedOptions, [optionName]: value };
    return variants.find((variant) =>
      variant.selectedOptions.every(
        (opt) => newSelectedOptions[opt.name] === opt.value
      )
    );
  };

  const handleOptionChange = (optionName: string, value: string) => {
    const newVariant = findVariant(optionName, value);
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  const handleAddToCart = () => {
    startTransition(async () => {
      try {
        await addItemToCart(selectedVariant.id, quantity);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
      } catch (error) {
        console.error('Failed to add to cart:', error);
      }
    });
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title & Price */}
      <div>
        <p className="text-sm font-medium text-[#D4AF37] uppercase tracking-widest">
          {product.vendor || 'Crazy Gels'}
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight lg:text-4xl">
          {product.title}
        </h1>
        
        {/* Price */}
        <div className="mt-4 flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-[#B8860B]">
            {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
          </span>
          {isOnSale && selectedVariant.compareAtPrice && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(selectedVariant.compareAtPrice.amount, selectedVariant.compareAtPrice.currencyCode)}
              </span>
              <span className="rounded-full bg-[#D4AF37]/10 px-2 py-1 text-xs font-medium tracking-wide text-[#B8860B]">
                SAVE {Math.round(
                  ((parseFloat(selectedVariant.compareAtPrice.amount) - parseFloat(selectedVariant.price.amount)) /
                    parseFloat(selectedVariant.compareAtPrice.amount)) *
                    100
                )}%
              </span>
            </>
          )}
        </div>
      </div>

      {/* Short Description */}
      {product.description && (
        <p className="text-muted-foreground leading-relaxed">
          {product.description.slice(0, 200)}
          {product.description.length > 200 ? '...' : ''}
        </p>
      )}

      {/* Variant Selectors */}
      {hasMultipleVariants && (
        <div className="space-y-4">
          {Object.entries(optionGroups).map(([optionName, values]) => (
            <div key={optionName}>
              <label className="mb-2 block text-sm font-medium">
                {optionName}: <span className="text-muted-foreground">{selectedOptions[optionName]}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const variant = findVariant(optionName, value);
                  const isSelected = selectedOptions[optionName] === value;
                  const isDisabled = !variant?.availableForSale;

                  // Check if this is a color option
                  const isColorOption = optionName.toLowerCase() === 'color' || optionName.toLowerCase() === 'colour';

                  return (
                    <button
                      key={value}
                      onClick={() => handleOptionChange(optionName, value)}
                      disabled={isDisabled}
                      className={cn(
                        'relative rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#B8860B]'
                          : 'border-border hover:border-muted-foreground',
                        isDisabled && 'cursor-not-allowed opacity-50'
                      )}
                      aria-label={`Select ${optionName}: ${value}`}
                      aria-pressed={isSelected}
                    >
                      {value}
                      {isDisabled && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-px w-full rotate-45 bg-muted-foreground" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <label className="mb-2 block text-sm font-medium">Quantity</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
              className="p-3 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center font-medium">{quantity}</span>
            <button
              onClick={increaseQuantity}
              className="p-3 transition-colors hover:bg-muted"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {!isAvailable && (
            <span className="text-sm text-destructive">Out of Stock</span>
          )}
        </div>
      </div>

      {/* Add to Cart Button */}
      <div className="flex gap-3">
        <Button
          onClick={handleAddToCart}
          disabled={isPending || !isAvailable}
          size="lg"
          className={cn(
            'flex-1 gap-2 text-lg font-medium transition-all',
            isAdded
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-[#D4AF37] hover:bg-[#B8860B] text-white'
          )}
        >
          {isPending ? (
            <span className="animate-pulse">Adding...</span>
          ) : isAdded ? (
            <>
              <Check className="h-5 w-5" />
              Added to Cart!
            </>
          ) : isAvailable ? (
            <>
              <ShoppingBag className="h-5 w-5" />
              Add to Cart
            </>
          ) : (
            'Out of Stock'
          )}
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="px-4"
          aria-label="Add to wishlist"
        >
          <Heart className="h-5 w-5" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="px-4"
          aria-label="Share product"
        >
          <Share2 className="h-5 w-5" />
        </Button>
      </div>

      {/* Product Meta */}
      <div className="space-y-2 border-t border-border pt-6 text-sm">
        {product.productType && (
          <p>
            <span className="text-muted-foreground">Category:</span>{' '}
            <span className="font-medium">{product.productType}</span>
          </p>
        )}
        {product.tags.length > 0 && (
          <p>
            <span className="text-muted-foreground">Tags:</span>{' '}
            <span className="font-medium">{product.tags.slice(0, 5).join(', ')}</span>
          </p>
        )}
        <p>
          <span className="text-muted-foreground">SKU:</span>{' '}
          <span className="font-medium">{selectedVariant.id.split('/').pop()}</span>
        </p>
      </div>
    </div>
  );
}
