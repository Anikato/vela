export interface ImageFocalPoint {
  focalX: number;
  focalY: number;
}

export function focalStyle(focal: ImageFocalPoint | null | undefined): React.CSSProperties | undefined {
  if (!focal || (focal.focalX === 50 && focal.focalY === 50)) return undefined;
  return { objectPosition: `${focal.focalX}% ${focal.focalY}%` };
}

export interface WebsiteSectionItem {
  id: string;
  iconName: string | null;
  imageUrl: string | null;
  imageFocal: ImageFocalPoint | null;
  linkUrl: string | null;
  config: Record<string, unknown>;
  translation: {
    title: string | null;
    description: string | null;
    content: string | null;
  };
}

export interface WebsiteSectionProductCard {
  id: string;
  slug: string;
  primaryCategorySlug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  featuredImage: {
    id: string;
    url: string;
    alt: string | null;
    focalX: number;
    focalY: number;
  } | null;
}

export interface WebsiteSectionCategoryCard {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  imageFocal: ImageFocalPoint | null;
  productCount: number;
}

export interface WebsiteSectionNewsCard {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImage: { url: string; alt: string | null; focalX: number; focalY: number } | null;
  publishedAt: string | null;
}

export interface WebsiteSection {
  id: string;
  type: string;
  config: Record<string, unknown>;
  isActive: boolean;
  anchorId: string | null;
  cssClass: string | null;
  translation: {
    title: string | null;
    subtitle: string | null;
    content: string | null;
    buttonText: string | null;
    buttonLink: string | null;
    secondaryButtonText: string | null;
    secondaryButtonLink: string | null;
  };
  items: WebsiteSectionItem[];
  data?: {
    products?: WebsiteSectionProductCard[];
    categories?: WebsiteSectionCategoryCard[];
    news?: WebsiteSectionNewsCard[];
  };
}

export interface SectionComponentProps {
  section: WebsiteSection;
  captchaSiteKey?: string | null;
}
