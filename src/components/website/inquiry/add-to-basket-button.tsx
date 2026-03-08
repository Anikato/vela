'use client';

import { useCallback, useState } from 'react';
import { Check, ShoppingCart } from 'lucide-react';

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
  const { addItem } = useInquiryBasket();
  const [added, setAdded] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({ productId, name, sku, imageUrl });
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    },
    [addItem, productId, name, sku, imageUrl],
  );

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition',
        added
          ? 'bg-green-100 text-green-700'
          : 'bg-primary/10 text-primary hover:bg-primary/20',
        className,
      )}
    >
      {added ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
