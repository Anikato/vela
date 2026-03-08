import Link from 'next/link';

import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function HeroSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const hasPrimaryButton = tr.buttonText && tr.buttonLink;
  const hasSecondaryButton = tr.secondaryButtonText && tr.secondaryButtonLink;
  const hasContent = tr.title || tr.subtitle || tr.content || hasPrimaryButton || hasSecondaryButton;

  if (!hasContent) return null;

  return (
    <div className="mx-auto max-w-3xl text-center">
      {tr.title ? <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tr.title}</h1> : null}
      {tr.subtitle ? (
        <p className="mt-3 text-lg text-muted-foreground sm:text-xl">{tr.subtitle}</p>
      ) : null}
      {tr.content ? (
        <div
          className="prose prose-sm mx-auto mt-6 max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: tr.content }}
        />
      ) : null}
      {hasPrimaryButton || hasSecondaryButton ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
