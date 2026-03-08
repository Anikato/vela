import * as LucideIcons from 'lucide-react';

import type { SectionComponentProps, WebsiteSectionItem } from '../types';

export function FeatureGridSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  const columns = Number(section.config.columns) || 3;
  const gridCols =
    columns === 2
      ? 'sm:grid-cols-2'
      : columns === 4
        ? 'sm:grid-cols-2 lg:grid-cols-4'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-10 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mt-3 text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${gridCols}`}>
        {items.map((item) => (
          <FeatureCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ item }: { item: WebsiteSectionItem }) {
  const IconComp = item.iconName
    ? (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.iconName]
    : null;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 transition hover:shadow-md">
      {IconComp && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
          <IconComp className="h-5 w-5 text-primary" />
        </div>
      )}
      {item.translation.title && (
        <h3 className="text-lg font-semibold">{item.translation.title}</h3>
      )}
      {item.translation.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {item.translation.description}
        </p>
      )}
    </div>
  );
}
