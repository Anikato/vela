'use client';

import { useEffect, useRef, useState } from 'react';

import type { SectionComponentProps } from '../types';

export function StatsSection({ section }: SectionComponentProps) {
  const tr = section.translation;
  const items = section.items;

  if (!items.length && !tr.title) return null;

  return (
    <div>
      {(tr.title || tr.subtitle) && (
        <div className="mb-12 text-center">
          {tr.title && <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">{tr.title}</h2>}
          {tr.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">{tr.subtitle}</p>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const numericValue = parseFloat(item.translation.description ?? '0');
          const suffix = item.translation.content ?? '';

          return (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 text-center transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 lg:p-8"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative">
                <AnimatedNumber value={numericValue} suffix={suffix} />
                {item.translation.title && (
                  <p className="mt-2 text-sm font-medium text-muted-foreground">{item.translation.title}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedNumber({ value, suffix }: { value: number; suffix: string }) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const startTime = performance.now();

          function tick(now: number) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplayed(Math.round(value * eased));
            if (progress < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
      {displayed.toLocaleString()}
      {suffix}
    </div>
  );
}
