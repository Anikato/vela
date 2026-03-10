'use client';

import { cn } from '@/lib/utils';
import { useScrollReveal } from '@/hooks/use-scroll-reveal';

import type { WebsiteSection } from './types';

interface SectionWrapperProps {
  section: WebsiteSection;
  children: React.ReactNode;
}

const BACKGROUND_CLASS_MAP: Record<string, string> = {
  white: 'bg-background',
  gray: 'bg-muted/40',
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  gradient: 'bg-gradient-to-br from-primary/10 via-background to-secondary/20',
  dark: 'bg-foreground text-background',
};

const SPACING_TOP_CLASS_MAP: Record<string, string> = {
  none: 'pt-0',
  sm: 'pt-8',
  md: 'pt-14',
  lg: 'pt-20',
  xl: 'pt-28',
};

const SPACING_BOTTOM_CLASS_MAP: Record<string, string> = {
  none: 'pb-0',
  sm: 'pb-8',
  md: 'pb-14',
  lg: 'pb-20',
  xl: 'pb-28',
};

const CONTAINER_CLASS_MAP: Record<string, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-5xl',
  wide: 'max-w-7xl',
  full: 'max-w-none px-0',
};

function getConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  return typeof value === 'string' ? value : null;
}

export function SectionWrapper({ section, children }: SectionWrapperProps) {
  const ref = useScrollReveal<HTMLElement>();

  const background = getConfigString(section.config, 'background') ?? 'white';
  const spacingTop = getConfigString(section.config, 'padding_top') ?? 'md';
  const spacingBottom = getConfigString(section.config, 'padding_bottom') ?? 'md';
  const containerWidth = getConfigString(section.config, 'container_width') ?? 'default';

  const sectionClassName = cn(
    BACKGROUND_CLASS_MAP[background] ?? BACKGROUND_CLASS_MAP.white,
    SPACING_TOP_CLASS_MAP[spacingTop] ?? SPACING_TOP_CLASS_MAP.md,
    SPACING_BOTTOM_CLASS_MAP[spacingBottom] ?? SPACING_BOTTOM_CLASS_MAP.md,
    section.cssClass,
  );

  return (
    <section ref={ref} id={section.anchorId ?? undefined} className={sectionClassName}>
      <div
        className={cn(
          'mx-auto px-4 sm:px-6 lg:px-8',
          CONTAINER_CLASS_MAP[containerWidth] ?? CONTAINER_CLASS_MAP.default,
        )}
      >
        {children}
      </div>
    </section>
  );
}
