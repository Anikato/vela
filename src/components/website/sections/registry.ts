import type { ComponentType } from 'react';

import { CtaSection } from './blocks/cta-section';
import { HeroSection } from './blocks/hero-section';
import { ProductShowcaseSection } from './blocks/product-showcase-section';
import { RichTextSection } from './blocks/rich-text-section';
import type { SectionComponentProps } from './types';

export const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  rich_text: RichTextSection,
  cta: CtaSection,
  product_showcase: ProductShowcaseSection,
};
