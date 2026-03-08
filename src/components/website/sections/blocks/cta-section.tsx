import Link from 'next/link';

import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function CtaSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const hasPrimaryButton = tr.buttonText && tr.buttonLink;
  const hasSecondaryButton = tr.secondaryButtonText && tr.secondaryButtonLink;

  if (!tr.title && !tr.subtitle && !hasPrimaryButton && !hasSecondaryButton) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl rounded-2xl border border-border/50 bg-card p-6 text-center sm:p-10">
      {tr.title ? <h2 className="text-2xl font-semibold">{tr.title}</h2> : null}
      {tr.subtitle ? <p className="mt-3 text-muted-foreground">{tr.subtitle}</p> : null}

      {hasPrimaryButton || hasSecondaryButton ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {hasPrimaryButton ? (
            <Button asChild>
              <Link href={tr.buttonLink!}>{tr.buttonText}</Link>
            </Button>
          ) : null}
          {hasSecondaryButton ? (
            <Button asChild variant="outline">
              <Link href={tr.secondaryButtonLink!}>{tr.secondaryButtonText}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
