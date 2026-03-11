'use client';

import { useCallback, useState } from 'react';
import { Check, Plus, ShoppingCart } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useInquiryBasket } from '@/hooks/use-inquiry-basket';

interface AddToBasketButtonProps {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  label: string;
  className?: string;
}

export function AddToBasketButton({
  productId,
  name,
  sku,
  imageUrl,
  label,
  className,
}: AddToBasketButtonProps) {
  const { items, addItem } = useInquiryBasket();
  const [justAdded, setJustAdded] = useState(false);

  const existingItem = items.find((i) => i.productId === productId);
  const isInBasket = Boolean(existingItem);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({ productId, name, sku, imageUrl });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    },
    [addItem, productId, name, sku, imageUrl],
  );

  if (justAdded) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700',
          className,
        )}
      >
        <Check className="h-3.5 w-3.5" />
        {existingItem && existingItem.quantity > 1
          ? `×${existingItem.quantity}`
          : label}
      </span>
    );
  }

  if (isInBasket) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
          'bg-primary/15 text-primary hover:bg-primary/25',
          className,
        )}
      >
        <Check className="h-3.5 w-3.5" />
        <span>×{existingItem!.quantity}</span>
        <Plus className="h-3 w-3 opacity-60" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
        'bg-primary/10 text-primary hover:bg-primary/20',
        className,
      )}
    >
      <ShoppingCart className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
