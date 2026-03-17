import Image from 'next/image';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

import { cn } from '@/lib/utils';
import type { SectionComponentProps, WebsiteSectionItem } from '../types';

type CardVariant = 'default' | 'bordered' | 'filled' | 'minimal';

export function FeatureGridSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 3;
  const variant = (section.config.card_variant as CardVariant) || 'default';
  const mobileGrid = items.length >= 3 ? 'grid-cols-2' : 'grid-cols-1';
  const gridCols =
    columns === 2
      ? `${mobileGrid} sm:grid-cols-2`
      : columns === 4
        ? `${mobileGrid} sm:grid-cols-2 lg:grid-cols-4`
        : `${mobileGrid} sm:grid-cols-2 lg:grid-cols-3`;

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-12 text-center">
          {tr.title && (
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>
          )}
          {tr.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className={cn('grid gap-3 sm:gap-6 lg:gap-8', gridCols)}>
        {items.map((item, idx) => (
          <FeatureCard key={item.id} item={item} variant={variant} index={idx} />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ item, variant, index }: { item: WebsiteSectionItem; variant: CardVariant; index: number }) {
  const IconComp = item.iconName
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.iconName]
    : null;

  const hasImage = Boolean(item.imageUrl);

  const content = (
    <div
      className={cn(
        'group relative h-full overflow-hidden rounded-2xl transition-all duration-300',
        hasImage ? 'p-0' : 'p-6',
        variant === 'default' && 'border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        variant === 'bordered' && 'border-2 border-border bg-transparent hover:border-primary/40 hover:bg-primary/[0.02]',
        variant === 'filled' && 'bg-muted/50 hover:bg-muted/80',
        variant === 'minimal' && 'hover:bg-muted/30',
      )}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Image mode: image at top, text below */}
      {hasImage && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={item.imageUrl!}
            alt={item.translation.title ?? ''}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}

      <div className={cn(hasImage && 'p-5')}>
        {/* Icon mode (only when no image) */}
        {!hasImage && IconComp && (
          <div className={cn(
            'mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300',
            variant === 'filled'
              ? 'bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
              : 'bg-primary/10 text-primary group-hover:bg-primary/20',
          )}>
            <IconComp className="h-6 w-6" />
          </div>
        )}

        {item.translation.title && (
          <h3 className="text-lg font-semibold tracking-tight">{item.translation.title}</h3>
        )}
        {item.translation.description && (
          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            {item.translation.description}
          </p>
        )}
        {item.linkUrl && (
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );

  if (item.linkUrl) {
    return <Link href={item.linkUrl} className="block h-full">{content}</Link>;
  }
  return content;
}
