import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

import type { SectionComponentProps } from './types';

function lazySection(loader: () => Promise<{ default: ComponentType<SectionComponentProps> }>) {
  return dynamic(loader, { ssr: true });
}

export const sectionRegistry: Record<string, ComponentType<SectionComponentProps>> = {
  hero: lazySection(() => import('./blocks/hero-section').then(m => ({ default: m.HeroSection }))),
  rich_text: lazySection(() => import('./blocks/rich-text-section').then(m => ({ default: m.RichTextSection }))),
  cta: lazySection(() => import('./blocks/cta-section').then(m => ({ default: m.CtaSection }))),
  product_showcase: lazySection(() => import('./blocks/product-showcase-section').then(m => ({ default: m.ProductShowcaseSection }))),
  feature_grid: lazySection(() => import('./blocks/feature-grid-section').then(m => ({ default: m.FeatureGridSection }))),
  carousel_banner: lazySection(() => import('./blocks/carousel-banner-section').then(m => ({ default: m.CarouselBannerSection }))),
  stats: lazySection(() => import('./blocks/stats-section').then(m => ({ default: m.StatsSection }))),
  faq: lazySection(() => import('./blocks/faq-section').then(m => ({ default: m.FaqSection }))),
  two_column: lazySection(() => import('./blocks/two-column-section').then(m => ({ default: m.TwoColumnSection }))),
  partner_logos: lazySection(() => import('./blocks/partner-logos-section').then(m => ({ default: m.PartnerLogosSection }))),
  testimonials: lazySection(() => import('./blocks/testimonials-section').then(m => ({ default: m.TestimonialsSection }))),
  category_nav: lazySection(() => import('./blocks/category-nav-section').then(m => ({ default: m.CategoryNavSection }))),
  video_embed: lazySection(() => import('./blocks/video-embed-section').then(m => ({ default: m.VideoEmbedSection }))),
  timeline: lazySection(() => import('./blocks/timeline-section').then(m => ({ default: m.TimelineSection }))),
  image_gallery: lazySection(() => import('./blocks/image-gallery-section').then(m => ({ default: m.ImageGallerySection }))),
  team: lazySection(() => import('./blocks/team-section').then(m => ({ default: m.TeamSection }))),
  contact_form: lazySection(() => import('./blocks/contact-form-section').then(m => ({ default: m.ContactFormSection }))),
  news_showcase: lazySection(() => import('./blocks/news-showcase-section').then(m => ({ default: m.NewsShowcaseSection }))),
  custom_html: lazySection(() => import('./blocks/custom-html-section').then(m => ({ default: m.CustomHtmlSection }))),
  google_map: lazySection(() => import('./blocks/google-map-section').then(m => ({ default: m.GoogleMapSection }))),
  image_marquee: lazySection(() => import('./blocks/image-marquee-section').then(m => ({ default: m.ImageMarqueeSection }))),
  video_gallery: lazySection(() => import('./blocks/video-gallery-section').then(m => ({ default: m.VideoGallerySection }))),
};
