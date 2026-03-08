import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import type { SectionComponentProps } from '../types';

export function TwoColumnSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const imageUrl = section.items[0]?.imageUrl ?? null;
  const reversed = section.config.reversed === true;

  const hasText = tr.title || tr.subtitle || tr.content || tr.buttonText;
  if (!hasText && !imageUrl) return null;

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
      {/* Image column */}
      <div className={reversed ? 'lg:order-2' : ''}>
        {imageUrl ? (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image
              src={imageUrl}
              alt={tr.title ?? ''}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-xl bg-muted/30" />
        )}
      </div>

      {/* Text column */}
      <div className={reversed ? 'lg:order-1' : ''}>
        {tr.title && (
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>
        )}
        {tr.subtitle && (
          <p className="mt-3 text-lg text-muted-foreground">{tr.subtitle}</p>
        )}
        {tr.content && (
          <div
            className="prose prose-sm mt-4 max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: tr.content }}
          />
        )}
        {tr.buttonText && tr.buttonLink && (
          <div className="mt-6">
            <Button asChild>
              <Link href={tr.buttonLink}>{tr.buttonText}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
