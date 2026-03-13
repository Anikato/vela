'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Check, Loader2, Send } from 'lucide-react';

import { submitInquiryAction } from '@/server/actions/inquiry.actions';

interface ContactFormProps {
  captchaSiteKey: string | null;
  labels: {
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButton: string;
    successMessage: string;
    errorMessage: string;
  };
}

export function ContactForm({ captchaSiteKey, labels }: ContactFormProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
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

      startTransition(async () => {
        const result = await submitInquiryAction({
          name: form.get('name') as string,
          email: form.get('email') as string,
          message: form.get('message') as string,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          captchaToken: captchaToken ?? undefined,
          products: [],
        });

        if (result.success) {
          setState('success');
          formRef.current?.reset();
        } else {
          setErrorMsg(typeof result.error === 'string' ? result.error : labels.errorMessage);
          setState('error');
        }

        setCaptchaToken(null);
        captchaRef.current?.reset();
      });
    },
    [captchaSiteKey, captchaToken, labels.errorMessage],
  );

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold">{labels.successMessage}</p>
        <button
          onClick={() => setState('idle')}
          className="mt-6 rounded-lg border border-border px-6 py-2 text-sm hover:bg-accent"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-border bg-card p-6"
    >
      {state === 'error' && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {labels.nameLabel} <span className="text-destructive">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder={labels.namePlaceholder}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {labels.emailLabel} <span className="text-destructive">*</span>
        </label>
        <input
          name="email"
          type="email"
          required
          placeholder={labels.emailPlaceholder}
          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {labels.messageLabel} <span className="text-destructive">*</span>
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder={labels.messagePlaceholder}
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

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

      <button
        type="submit"
        disabled={isPending || (!!captchaSiteKey && !captchaToken)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {labels.submitButton}
      </button>
    </form>
  );
}
