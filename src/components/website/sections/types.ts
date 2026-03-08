export interface WebsiteSectionItem {
  id: string;
  iconName: string | null;
  imageUrl: string | null;
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
  } | null;
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
  };
}

export interface SectionComponentProps {
  section: WebsiteSection;
}
