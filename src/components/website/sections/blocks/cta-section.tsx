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
    <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-8 text-center text-primary-foreground sm:p-12 lg:p-16">
      <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute left-1/2 top-0 h-20 w-20 -translate-x-1/2 rounded-full bg-white/5" />

      <div className="relative">
        {tr.title ? (
          <h2 className="text-2xl font-bold sm:text-3xl lg:text-4xl">{tr.title}</h2>
        ) : null}
        {tr.subtitle ? (
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80 sm:text-lg">{tr.subtitle}</p>
        ) : null}

        {hasPrimaryButton || hasSecondaryButton ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {hasPrimaryButton ? (
              <Button asChild size="lg" variant="secondary" className="rounded-full px-8 text-base font-semibold shadow-lg">
                <Link href={tr.buttonLink!}>{tr.buttonText}</Link>
              </Button>
            ) : null}
            {hasSecondaryButton ? (
              <Button asChild size="lg" className="rounded-full border-2 border-primary-foreground/40 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10">
                <Link href={tr.secondaryButtonLink!}>{tr.secondaryButtonText}</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
