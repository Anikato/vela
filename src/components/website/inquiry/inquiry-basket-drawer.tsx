'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useInquiryBasket, type InquiryBasketItem } from '@/hooks/use-inquiry-basket';
import { InquiryFormDialog, type CustomFormField } from './inquiry-form-dialog';

interface InquiryBasketDrawerProps {
  captchaSiteKey: string | null;
  customFormFields?: CustomFormField[];
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

export function InquiryBasketTrigger({ captchaSiteKey, customFormFields, uiLabels, formLabels }: InquiryBasketDrawerProps) {
  const { items, totalCount, removeItem, updateQuantity, clearBasket } = useInquiryBasket();
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  return (
    <>
      {/* Trigger — 始终在 header 内 */}
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

      {/* Portal: 抽屉渲染到 body，脱离 header 的 backdrop-filter 层叠上下文 */}
      {mounted && open && createPortal(
        <BasketDrawer
          items={items}
          totalCount={totalCount}
          uiLabels={uiLabels}
          onClose={() => setOpen(false)}
          onRemove={removeItem}
          onQuantityChange={updateQuantity}
          onClearAll={clearBasket}
          onSubmit={() => { setOpen(false); setShowForm(true); }}
        />,
        document.body,
      )}

      {mounted && showForm && createPortal(
        <InquiryFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          labels={formLabels}
          captchaSiteKey={captchaSiteKey}
          customFields={customFormFields}
        />,
        document.body,
      )}
    </>
  );
}

/* ─── Drawer ─── */

interface BasketDrawerProps {
  items: InquiryBasketItem[];
  totalCount: number;
  uiLabels: { title: string; empty: string; submitInquiry: string; clearAll: string; close: string };
  onClose: () => void;
  onRemove: (productId: string) => void;
  onQuantityChange: (productId: string, q: number) => void;
  onClearAll: () => void;
  onSubmit: () => void;
}

function BasketDrawer({ items, totalCount, uiLabels, onClose, onRemove, onQuantityChange, onClearAll, onSubmit }: BasketDrawerProps) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label={uiLabels.title}>
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-280',
          visible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          'absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-popover shadow-2xl transition-transform duration-280 ease-out',
          'border-l border-border',
          visible ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center gap-2.5 border-b border-border px-4">
          <ShoppingCart className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 text-sm font-semibold">{uiLabels.title}</span>
          {totalCount > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium tabular-nums text-primary">
              {totalCount}
            </span>
          )}
          <button
            onClick={handleClose}
            className="-mr-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label={uiLabels.close}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Item list */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingCart className="mb-2 h-8 w-8 text-muted-foreground/25" />
              <p className="text-sm text-muted-foreground">{uiLabels.empty}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <BasketItem
                  key={item.productId}
                  item={item}
                  onRemove={() => onRemove(item.productId)}
                  onQuantityChange={(q) => onQuantityChange(item.productId, q)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-border p-3 sm:p-4">
            <button
              onClick={onSubmit}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:bg-primary/80"
            >
              {uiLabels.submitInquiry}
            </button>
            <button
              onClick={onClearAll}
              className="mt-1.5 flex h-8 w-full items-center justify-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {uiLabels.clearAll}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Basket Item ─── */

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
    <li className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-2.5">
      {/* Thumbnail */}
      {item.imageUrl ? (
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={item.imageUrl} alt={item.name} width={48} height={48} className="h-full w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ShoppingCart className="h-4 w-4 opacity-30" />
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{item.name}</p>
        {item.sku && <p className="truncate text-xs text-muted-foreground">{item.sku}</p>}
      </div>

      {/* Qty controls */}
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={() => onQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-7 text-center text-xs font-semibold tabular-nums">{item.quantity}</span>
        <button
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-border transition-colors hover:bg-accent"
          aria-label="Increase quantity"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
