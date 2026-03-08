import type { ComponentType } from 'react';

import { CarouselBannerSection } from './blocks/carousel-banner-section';
import { CategoryNavSection } from './blocks/category-nav-section';
import { ContactFormSection } from './blocks/contact-form-section';
import { CtaSection } from './blocks/cta-section';
import { CustomHtmlSection } from './blocks/custom-html-section';
import { FaqSection } from './blocks/faq-section';
import { NewsShowcaseSection } from './blocks/news-showcase-section';
import { FeatureGridSection } from './blocks/feature-grid-section';
import { HeroSection } from './blocks/hero-section';
import { ImageGallerySection } from './blocks/image-gallery-section';
import { PartnerLogosSection } from './blocks/partner-logos-section';
import { ProductShowcaseSection } from './blocks/product-showcase-section';
import { RichTextSection } from './blocks/rich-text-section';
import { StatsSection } from './blocks/stats-section';
import { TeamSection } from './blocks/team-section';
import { TestimonialsSection } from './blocks/testimonials-section';
import { TimelineSection } from './blocks/timeline-section';
import { TwoColumnSection } from './blocks/two-column-section';
import { VideoEmbedSection } from './blocks/video-embed-section';
import type { SectionComponentProps } from './types';

export const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: HeroSection,
  rich_text: RichTextSection,
  cta: CtaSection,
  product_showcase: ProductShowcaseSection,
  feature_grid: FeatureGridSection,
  carousel_banner: CarouselBannerSection,
  stats: StatsSection,
  faq: FaqSection,
  two_column: TwoColumnSection,
  partner_logos: PartnerLogosSection,
  testimonials: TestimonialsSection,
  category_nav: CategoryNavSection,
  video_embed: VideoEmbedSection,
  timeline: TimelineSection,
  image_gallery: ImageGallerySection,
  team: TeamSection,
  contact_form: ContactFormSection,
  news_showcase: NewsShowcaseSection,
  custom_html: CustomHtmlSection,
};
