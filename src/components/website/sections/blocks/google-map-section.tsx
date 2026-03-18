'use client';

import type { SectionComponentProps } from '../types';

export function GoogleMapSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const embedUrl = section.config.embed_url as string | undefined;
  const height = (section.config.map_height as string) || '450px';
  const borderRadius = (section.config.border_radius as string) || '12px';

  if (!embedUrl) return null;

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
      <div
        className="overflow-hidden shadow-sm"
        style={{ borderRadius }}
      >
        <iframe
          src={embedUrl}
          width="100%"
          height={height}
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={tr.title ?? 'Google Maps'}
        />
      </div>
      {tr.content && (
        <p className="mt-4 text-center text-sm text-muted-foreground">{tr.content}</p>
      )}
    </div>
  );
}
