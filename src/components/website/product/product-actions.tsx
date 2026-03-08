'use client';

import { useCallback, useState } from 'react';
import { Check, Minus, Plus, Send, ShoppingCart } from 'lucide-react';

import { useInquiryBasket } from '@/hooks/use-inquiry-basket';
import { InquiryFormDialog, type CustomFormField } from '@/components/website/inquiry/inquiry-form-dialog';

interface ProductActionsProps {
  productId: string;
  name: string;
  sku: string;
  imageUrl?: string;
  captchaSiteKey: string | null;
  customFormFields?: CustomFormField[];
  labels: {
    addToBasket: string;
    sendInquiry: string;
    formTitle: string;
    formName: string;
    formEmail: string;
    formPhone: string;
    formCompany: string;
    formCountry: string;
    formMessage: string;
    formSubmit: string;
    formCancel: string;
    formSuccess: string;
    formError: string;
  };
}

export function ProductActions({
  productId,
  name,
  sku,
  imageUrl,
  captchaSiteKey,
  customFormFields,
  labels,
}: ProductActionsProps) {
  const { addItem } = useInquiryBasket();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleAddToBasket = useCallback(() => {
    addItem({ productId, name, sku, imageUrl }, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [addItem, productId, name, sku, imageUrl, quantity]);

  const handleQuickInquiry = useCallback(() => {
    addItem({ productId, name, sku, imageUrl }, quantity);
    setShowForm(true);
  }, [addItem, productId, name, sku, imageUrl, quantity]);

  return (
    <>
      <div className="space-y-4">
        {/* Quantity selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition hover:bg-accent disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-10 text-center text-lg font-medium tabular-nums">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border transition hover:bg-accent"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button
            onClick={handleAddToBasket}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary bg-primary/10 px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary/20"
          >
            {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            {labels.addToBasket}
          </button>
          <button
            onClick={handleQuickInquiry}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            {labels.sendInquiry}
          </button>
        </div>
      </div>

      {showForm && (
        <InquiryFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          captchaSiteKey={captchaSiteKey}
          customFields={customFormFields}
          labels={{
            title: labels.formTitle,
            name: labels.formName,
            email: labels.formEmail,
            phone: labels.formPhone,
            company: labels.formCompany,
            country: labels.formCountry,
            message: labels.formMessage,
            submit: labels.formSubmit,
            cancel: labels.formCancel,
            success: labels.formSuccess,
            error: labels.formError,
          }}
        />
      )}
    </>
  );
}
