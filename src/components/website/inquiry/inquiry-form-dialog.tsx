'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Check, Loader2, X } from 'lucide-react';

import { useInquiryBasket } from '@/hooks/use-inquiry-basket';
import { getLocaleFromPathname } from '@/lib/utils';
import { submitInquiryAction } from '@/server/actions/inquiry.actions';

export interface CustomFormField {
  id: string;
  fieldType: string;
  isRequired: boolean;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  options: string[] | null;
}

interface InquiryFormDialogProps {
  open: boolean;
  onClose: () => void;
  captchaSiteKey: string | null;
  customFields?: CustomFormField[];
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

export function InquiryFormDialog({ open, onClose, captchaSiteKey, customFields = [], labels }: InquiryFormDialogProps) {
  const { items, clearBasket } = useInquiryBasket();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<'form' | 'success' | 'error'>('form');
  const [inquiryNumber, setInquiryNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileInstance>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (captchaSiteKey && !captchaToken) {
        return;
      }

      const form = new FormData(e.currentTarget);

      const customFieldValues: Record<string, unknown> = {};
      for (const field of customFields) {
        const key = `custom_${field.id}`;
        if (field.fieldType === 'multiselect') {
          customFieldValues[field.id] = form.getAll(key);
        } else {
          const val = form.get(key);
          if (val !== null && val !== '') {
            customFieldValues[field.id] = val;
          }
        }
      }

      startTransition(async () => {
        const result = await submitInquiryAction({
          name: form.get('name') as string,
          email: form.get('email') as string,
          phone: (form.get('phone') as string) || undefined,
          company: (form.get('company') as string) || undefined,
          country: (form.get('country') as string) || undefined,
          message: form.get('message') as string,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          locale: getLocaleFromPathname(),
          captchaToken: captchaToken ?? undefined,
          customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined,
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

        setCaptchaToken(null);
        captchaRef.current?.reset();
      });
    },
    [items, clearBasket, labels.error, captchaSiteKey, captchaToken, customFields],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={labels.title}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-popover p-6 shadow-2xl">
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

            {items.length > 0 && (
              <div className="mb-4 max-h-32 overflow-y-auto rounded-lg border border-border p-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-sm">
                    <span className="line-clamp-1">{item.name}</span>
                    <span className="ml-2 shrink-0 text-muted-foreground">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            )}

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <PresetField name="name" label={labels.name} required />
                <PresetField name="email" label={labels.email} type="email" required />
                <PresetField name="phone" label={labels.phone} />
                <PresetField name="company" label={labels.company} />
              </div>
              <PresetField name="country" label={labels.country} />
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

              {/* Dynamic custom fields */}
              {customFields.length > 0 && (
                <div className="space-y-4 border-t border-border pt-4">
                  {customFields.map((field) => (
                    <DynamicField key={field.id} field={field} />
                  ))}
                </div>
              )}

              {captchaSiteKey && (
                <div className="flex justify-center">
                  <Turnstile
                    ref={captchaRef}
                    siteKey={captchaSiteKey}
                    onSuccess={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    options={{ size: 'compact' }}
                  />
                </div>
              )}

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
                  disabled={isPending || (!!captchaSiteKey && !captchaToken)}
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

function PresetField({
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

function DynamicField({ field }: { field: CustomFormField }) {
  const inputName = `custom_${field.id}`;
  const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {field.label}
        {field.isRequired ? <span className="text-destructive"> *</span> : null}
      </label>

      {field.fieldType === 'text' && (
        <input
          name={inputName}
          type="text"
          required={field.isRequired}
          placeholder={field.placeholder ?? undefined}
          className={inputCls}
        />
      )}

      {field.fieldType === 'number' && (
        <input
          name={inputName}
          type="number"
          required={field.isRequired}
          placeholder={field.placeholder ?? undefined}
          className={inputCls}
        />
      )}

      {field.fieldType === 'select' && field.options && (
        <select name={inputName} required={field.isRequired} className={inputCls} defaultValue="">
          <option value="" disabled>
            {field.placeholder ?? '—'}
          </option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.fieldType === 'multiselect' && field.options && (
        <div className="space-y-1.5">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={inputName} value={opt} className="rounded border-border" />
              {opt}
            </label>
          ))}
        </div>
      )}

      {field.fieldType === 'file' && (
        <input
          name={inputName}
          type="file"
          required={field.isRequired}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary"
        />
      )}

      {field.helpText && (
        <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
}
