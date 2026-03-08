'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { Check, Loader2, Send } from 'lucide-react';

import { submitInquiryAction } from '@/server/actions/inquiry.actions';
import type { SectionComponentProps } from '../types';

export function ContactFormSection({ section }: SectionComponentProps) {
  const tr = section.translation;

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-8 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="mx-auto max-w-xl">
        <InlineContactForm
          submitLabel={tr.buttonText}
          successMessage={tr.content}
        />
      </div>
    </div>
  );
}

function InlineContactForm({
  submitLabel,
  successMessage,
}: {
  submitLabel: string | null;
  successMessage: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);

      startTransition(async () => {
        const result = await submitInquiryAction({
          name: form.get('name') as string,
          email: form.get('email') as string,
          message: form.get('message') as string,
          sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          products: [],
        });

        if (result.success) {
          setState('success');
          formRef.current?.reset();
        } else {
          setErrorMsg(typeof result.error === 'string' ? result.error : 'Submission failed');
          setState('error');
        }
      });
    },
    [],
  );

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-10 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-6 w-6" />
        </div>
        <p className="text-lg font-semibold">{successMessage ?? 'Thank you!'}</p>
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
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {state === 'error' && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <input
            name="name"
            type="text"
            required
            placeholder="Name *"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <input
            name="email"
            type="email"
            required
            placeholder="Email *"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div>
        <textarea
          name="message"
          required
          rows={4}
          placeholder="Message *"
          className="w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {submitLabel ?? 'Send Message'}
      </button>
    </form>
  );
}
