'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useTransition, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Check, ArrowUpDown } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Best Selling', value: 'best_selling', order: 'desc' },
  { label: 'Newest', value: 'created_at', order: 'desc' },
  { label: 'Price: Low to High', value: 'price', order: 'asc' },
  { label: 'Price: High to Low', value: 'price', order: 'desc' },
  { label: 'A-Z', value: 'title', order: 'asc' },
  { label: 'Z-A', value: 'title', order: 'desc' },
];

export function CollectionSorting({
  currentSort,
  currentOrder,
}: {
  currentSort?: string;
  currentOrder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current selection
  const currentOption = SORT_OPTIONS.find(
    (opt) => opt.value === currentSort && opt.order === currentOrder
  ) || SORT_OPTIONS[0];

  const handleSort = useCallback(
    (value: string, order: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('sort', value);
      params.set('order', order);

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
      setIsOpen(false);
    },
    [pathname, router, searchParams]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-[#B76E79]/20 bg-[#FFFEF9] px-4 py-2.5 text-sm text-[#2C2C2C] transition-colors hover:border-[#B76E79]/40 hover:bg-[#B76E79]/5"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <ArrowUpDown className="h-4 w-4 text-[#2C2C2C]/60" />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#2C2C2C]/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
        {isPending && (
          <span className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-[#B76E79] border-t-transparent" />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-xl border border-[#B76E79]/20 bg-[#FFFEF9] p-1 shadow-xl"
          role="listbox"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === currentOption.value && option.order === currentOption.order;
            return (
              <button
                key={`${option.value}-${option.order}`}
                onClick={() => handleSort(option.value, option.order)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  isSelected
                    ? 'bg-[#B76E79]/10 text-[#A15D67]'
                    : 'text-[#2C2C2C] hover:bg-[#B76E79]/5'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                {option.label}
                {isSelected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
