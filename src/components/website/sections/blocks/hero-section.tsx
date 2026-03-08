import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function HeroSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const hasPrimaryButton = tr.buttonText && tr.buttonLink;
  const hasSecondaryButton = tr.secondaryButtonText && tr.secondaryButtonLink;
  const hasContent = tr.title || tr.subtitle || tr.content || hasPrimaryButton || hasSecondaryButton;

  if (!hasContent) return null;

  const bgImageUrl = section.items[0]?.imageUrl ?? null;
  const hasBackground = !!bgImageUrl;

  if (hasBackground) {
    return (
      <div className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="relative min-h-[360px] sm:min-h-[460px] lg:min-h-[540px]">
          <Image
            src={bgImageUrl!}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 flex min-h-[360px] items-center justify-center px-4 sm:min-h-[460px] sm:px-6 lg:min-h-[540px] lg:px-8">
            <div className="mx-auto max-w-3xl text-center text-white">
              {tr.title ? (
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{tr.title}</h1>
              ) : null}
              {tr.subtitle ? (
                <p className="mt-4 text-lg text-white/80 sm:text-xl">{tr.subtitle}</p>
              ) : null}
              {tr.content ? (
                <div
                  className="prose prose-sm prose-invert mx-auto mt-6 max-w-none"
                  dangerouslySetInnerHTML={{ __html: tr.content }}
                />
              ) : null}
              {hasPrimaryButton || hasSecondaryButton ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {hasPrimaryButton ? (
                    <Button asChild size="lg">
                      <Link href={tr.buttonLink!}>{tr.buttonText}</Link>
                    </Button>
                  ) : null}
                  {hasSecondaryButton ? (
                    <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                      <Link href={tr.secondaryButtonLink!}>{tr.secondaryButtonText}</Link>
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
