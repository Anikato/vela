import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function TwoColumnSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const imageUrl = section.items[0]?.imageUrl ?? null;
  const reversed = section.config.reversed === true;

  const hasText = tr.title || tr.subtitle || tr.content || tr.buttonText;
  if (!hasText && !imageUrl) return null;

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn(reversed ? 'lg:order-2' : '')}>
        {imageUrl ? (
          <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={imageUrl}
              alt={tr.title ?? ''}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-2xl bg-muted/20" />
        )}
      </div>

      <div className={cn(reversed ? 'lg:order-1' : '')}>
        {tr.title && (
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>
        )}
        {tr.subtitle && (
          <p className="mt-4 text-lg text-muted-foreground">{tr.subtitle}</p>
        )}
        {tr.content && (
          <div
            className="prose prose-sm mt-5 max-w-none text-foreground/80"
            dangerouslySetInnerHTML={{ __html: tr.content }}
          />
        )}
        {tr.buttonText && tr.buttonLink && (
          <div className="mt-8">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href={tr.buttonLink}>{tr.buttonText}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
