import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { getSectionTextConfig } from '@/lib/section-text-config';

import type { SectionComponentProps } from '../types';

export function HeroSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const hasPrimaryButton = tr.buttonText && tr.buttonLink;
  const hasSecondaryButton = tr.secondaryButtonText && tr.secondaryButtonLink;
  const hasContent = tr.title || tr.subtitle || tr.content || hasPrimaryButton || hasSecondaryButton;

  if (!hasContent) return null;

  const bgImageUrl = section.items[0]?.imageUrl ?? null;
  const hasBackground = !!bgImageUrl;

  const textCfg = getSectionTextConfig(section.config, {
    titleSizeClass: 'text-3xl sm:text-5xl lg:text-6xl',
    subtitleSizeClass: hasBackground ? 'text-lg sm:text-xl lg:text-2xl' : 'text-lg sm:text-xl',
  });

  if (hasBackground) {
    return (
      <div className="relative -mx-4 overflow-hidden sm:-mx-6 lg:-mx-8">
        <div className="relative min-h-[400px] sm:min-h-[500px] lg:min-h-[600px]">
          <Image
            src={bgImageUrl!}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

          <div className="relative z-10 flex min-h-[400px] items-center px-4 sm:min-h-[500px] sm:px-8 lg:min-h-[600px] lg:px-16">
            <div className={cn('max-w-2xl text-white', textCfg.lineHeightClass)}>
              {tr.title ? (
                <h1
                  className={cn('font-bold tracking-tight', textCfg.title.sizeClass, textCfg.title.colorClass)}
                  style={textCfg.title.style}
                >
                  {tr.title}
                </h1>
              ) : null}
              {tr.title && textCfg.divider.show && (
                <div className={textCfg.divider.className} style={textCfg.divider.style} />
              )}
              {tr.subtitle ? (
                <p
                  className={cn('mt-5 text-white/80', textCfg.subtitle.sizeClass, textCfg.subtitle.colorClass || '')}
                  style={textCfg.subtitle.style}
                >
                  {tr.subtitle}
                </p>
              ) : null}
              {tr.content ? (
                <div
                  className="prose prose-sm prose-invert mt-6 max-w-none text-white/70"
                  dangerouslySetInnerHTML={{ __html: tr.content }}
                />
              ) : null}
              {hasPrimaryButton || hasSecondaryButton ? (
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  {hasPrimaryButton ? (
                    <Button asChild size="lg" className="rounded-full px-8 text-base">
                      <Link href={tr.buttonLink!}>{tr.buttonText}</Link>
                    </Button>
                  ) : null}
                  {hasSecondaryButton ? (
                    <Button asChild size="lg" className="rounded-full border-2 border-white/40 bg-white/10 px-8 text-base text-white hover:bg-white/20">
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
    <div className={cn('py-8 text-center sm:py-12', textCfg.lineHeightClass)}>
      {tr.title ? (
        <h1
          className={cn('font-bold tracking-tight', textCfg.title.sizeClass, textCfg.title.colorClass)}
          style={textCfg.title.style}
        >
          {tr.title}
        </h1>
      ) : null}
      {tr.title && textCfg.divider.show && (
        <div className={cn('mx-auto', textCfg.divider.className)} style={textCfg.divider.style} />
      )}
      {tr.subtitle ? (
        <p
          className={cn('mx-auto mt-5 max-w-2xl text-muted-foreground', textCfg.subtitle.sizeClass, textCfg.subtitle.colorClass)}
          style={textCfg.subtitle.style}
        >
          {tr.subtitle}
        </p>
      ) : null}
      {tr.content ? (
        <div
          className="prose prose-sm mx-auto mt-6 max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: tr.content }}
        />
      ) : null}
      {hasPrimaryButton || hasSecondaryButton ? (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {hasPrimaryButton ? (
            <Button asChild size="lg" className="rounded-full px-8 text-base">
              <Link href={tr.buttonLink!}>{tr.buttonText}</Link>
            </Button>
          ) : null}
          {hasSecondaryButton ? (
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 text-base">
              <Link href={tr.secondaryButtonLink!}>{tr.secondaryButtonText}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
