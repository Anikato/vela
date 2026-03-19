import { cn } from '@/lib/utils';

import type { WebsiteSection } from './types';

interface SectionWrapperProps {
  section: WebsiteSection;
  children: React.ReactNode;
}

const BACKGROUND_CLASS_MAP: Record<string, string> = {
  transparent: 'bg-transparent',
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
  xs: 'max-w-2xl',
  narrow: 'max-w-3xl',
  medium: 'max-w-4xl',
  default: 'vt-container-inner',
  wide: 'max-w-[var(--max-width,80rem)]',
  'extra-wide': 'max-w-[1400px]',
  '1600': 'max-w-[1600px]',
  '1800': 'max-w-[1800px]',
  full: 'max-w-none px-0',
};

const DEFAULT_CONTAINER_BY_TYPE: Record<string, string> = {
  rich_text: 'medium',
  faq: 'narrow',
  cta: 'medium',
  video_embed: 'medium',
  timeline: 'medium',
  contact_form: 'narrow',
  hero: 'medium',
  testimonials: 'default',
  google_map: 'default',
};

function getConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  return typeof value === 'string' ? value : null;
}

export function SectionWrapper({ section, children }: SectionWrapperProps) {
  const explicitBg = getConfigString(section.config, 'background');
  const background = explicitBg ?? (section.config._defaultBg as string | undefined) ?? 'white';
  const spacingTop = getConfigString(section.config, 'padding_top') ?? 'md';
  const spacingBottom = getConfigString(section.config, 'padding_bottom') ?? 'md';
  const explicitContainerWidth = getConfigString(section.config, 'container_width');
  const containerWidth = explicitContainerWidth ?? DEFAULT_CONTAINER_BY_TYPE[section.type] ?? 'default';
  const containerWidthCustom = getConfigString(section.config, 'container_width_custom');
  const backgroundImage = getConfigString(section.config, 'background_image');
  const overlayOpacity = Number(section.config.overlay_opacity) || 0;

  const sectionClassName = cn(
    'relative vt-section-reveal',
    !backgroundImage && (BACKGROUND_CLASS_MAP[background] ?? BACKGROUND_CLASS_MAP.white),
    SPACING_TOP_CLASS_MAP[spacingTop] ?? SPACING_TOP_CLASS_MAP.md,
    SPACING_BOTTOM_CLASS_MAP[spacingBottom] ?? SPACING_BOTTOM_CLASS_MAP.md,
    section.cssClass,
  );

  return (
    <section id={section.anchorId ?? undefined} className={sectionClassName}>
      {backgroundImage && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          {overlayOpacity > 0 && (
            <div
              className="absolute inset-0 bg-black"
              style={{ opacity: overlayOpacity / 100 }}
            />
          )}
        </>
      )}
      <div
        className={cn(
          'relative mx-auto px-4 sm:px-6 lg:px-8',
          containerWidth !== 'custom' && (CONTAINER_CLASS_MAP[containerWidth] ?? CONTAINER_CLASS_MAP.default),
        )}
        style={containerWidth === 'custom' && containerWidthCustom ? { maxWidth: containerWidthCustom } : undefined}
      >
        {children}
      </div>
    </section>
  );
}
