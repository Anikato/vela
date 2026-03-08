'use client';

import { useCallback, useState, useTransition } from 'react';
import { Check, Loader2, X } from 'lucide-react';

import { useInquiryBasket } from '@/hooks/use-inquiry-basket';
import { submitInquiryAction } from '@/server/actions/inquiry.actions';

interface InquiryFormDialogProps {
  open: boolean;
  onClose: () => void;
  labels: {
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

export function InquiryFormDialog({ open, onClose, labels }: InquiryFormDialogProps) {
  const { items, clearBasket } = useInquiryBasket();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<'form' | 'success' | 'error'>('form');
  const [inquiryNumber, setInquiryNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);

      startTransition(async () => {
        const result = await submitInquiryAction({
          name: form.get('name') as string,
          email: form.get('email') as string,
          phone: (form.get('phone') as string) || undefined,
          company: (form.get('company') as string) || undefined,
          country: (form.get('country') as string) || undefined,
          message: form.get('message') as string,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          products: items.map((item) => ({
            productId: item.productId,
            snapshot: {
              name: item.name,
              sku: item.sku,
              imageUrl: item.imageUrl,
            },
            quantity: item.quantity,
          })),
        });

        if (result.success) {
          setInquiryNumber(result.data.inquiryNumber);
          setState('success');
          clearBasket();
        } else {
          setErrorMsg(typeof result.error === 'string' ? result.error : labels.error);
          setState('error');
        }
      });
    },
    [items, clearBasket, labels.error],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-background p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-1 hover:bg-accent"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {state === 'success' ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-lg font-semibold">{labels.success}</p>
            <p className="mt-2 text-sm text-muted-foreground">#{inquiryNumber}</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-primary px-8 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              OK
            </button>
          </div>
        ) : state === 'error' ? (
          <div className="py-8 text-center">
            <p className="text-lg font-semibold text-destructive">{labels.error}</p>
            <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => setState('form')}
              className="mt-6 rounded-lg border border-border px-8 py-2 text-sm hover:bg-accent"
            >
              {labels.cancel}
            </button>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-lg font-semibold">{labels.title}</h2>

            {/* Product summary */}
            {items.length > 0 ? (
              <div className="mb-4 max-h-32 overflow-y-auto rounded-lg border border-border p-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="line-clamp-1">{item.name}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField name="name" label={labels.name} required />
                <FormField name="email" label={labels.email} type="email" required />
                <FormField name="phone" label={labels.phone} />
                <FormField name="company" label={labels.company} />
              </div>
              <FormField name="country" label={labels.country} />
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  {labels.message} <span className="text-destructive">*</span>
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-border py-2.5 text-sm hover:bg-accent"
                >
                  {labels.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {labels.submit}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({
  name,
  label,
  type = 'text',
  required = false,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required ? <span className="text-destructive">*</span> : null}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
