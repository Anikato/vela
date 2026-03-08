'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useInquiryBasket, type InquiryBasketItem } from '@/hooks/use-inquiry-basket';
import { InquiryFormDialog } from './inquiry-form-dialog';

interface InquiryBasketDrawerProps {
  uiLabels: {
    title: string;
    empty: string;
    submitInquiry: string;
    clearAll: string;
    close: string;
  };
  formLabels: {
    title: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    country: string;
    message: string;
    submit: string;
    cancel: string;
    success: string;
    error: string;
  };
}

export function InquiryBasketTrigger({ uiLabels, formLabels }: InquiryBasketDrawerProps) {
  const { items, totalCount, removeItem, updateQuantity, clearBasket } = useInquiryBasket();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border hover:bg-accent"
        aria-label={uiLabels.title}
      >
        <ShoppingCart className="h-4 w-4" />
        {totalCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        ) : null}
      </button>

      {/* Drawer overlay */}
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-lg font-semibold">{uiLabels.title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-accent"
                aria-label={uiLabels.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">{uiLabels.empty}</p>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <BasketItem
                      key={item.productId}
                      item={item}
                      onRemove={() => removeItem(item.productId)}
                      onQuantityChange={(q) => updateQuantity(item.productId, q)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer actions */}
            {items.length > 0 ? (
              <div className="border-t border-border p-4 space-y-2">
                <button
                  onClick={() => { setShowForm(true); setOpen(false); }}
                  className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {uiLabels.submitInquiry}
                </button>
                <button
                  onClick={clearBasket}
                  className="w-full rounded-lg border border-border py-2 text-sm text-muted-foreground hover:bg-accent"
                >
                  {uiLabels.clearAll}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Inquiry form dialog */}
      {showForm ? (
        <InquiryFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          labels={formLabels}
        />
      ) : null}
    </>
  );
}

function BasketItem({
  item,
  onRemove,
  onQuantityChange,
}: {
  item: InquiryBasketItem;
  onRemove: () => void;
  onQuantityChange: (q: number) => void;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border p-3">
      {item.imageUrl ? (
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-muted">
          <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
          —
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            onClick={() => onQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="rounded border border-border p-0.5 hover:bg-accent disabled:opacity-40"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="min-w-6 text-center text-sm">{item.quantity}</span>
          <button
            onClick={() => onQuantityChange(item.quantity + 1)}
            className="rounded border border-border p-0.5 hover:bg-accent"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="self-start rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
