/**
 * Client-safe type definitions for website (public) components.
 *
 * See types/admin.ts for why this file exists.
 */

// ─── Product (Public) ───
export interface PublicProductMediaItem {
  id: string;
  url: string;
  alt: string | null;
}

export interface PublicProductCardItem {
  id: string;
  slug: string;
  primaryCategorySlug: string;
  primaryCategoryName: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  featuredImage: PublicProductMediaItem | null;
}

export type ProductSortOption = 'newest' | 'popular' | 'name_asc' | 'name_desc';

export interface PublicCategorySummary {
  id: string;
  slug: string;
  name: string;
}

export interface PublicProductListResult {
  items: PublicProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  category: PublicCategorySummary | null;
}

export interface PublicCategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  productCount: number;
  children: PublicCategoryTreeNode[];
}

export interface PublicTagItem {
  id: string;
  slug: string;
  name: string;
  productCount: number;
}

export interface PublicProductSearchResult {
  items: PublicProductCardItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  query: string;
}

export interface PublicProductAttributeItem {
  id: string;
  name: string;
  value: string;
  sortOrder: number;
}

export interface PublicProductAttributeGroup {
  id: string;
  name: string;
  sortOrder: number;
  attributes: PublicProductAttributeItem[];
}

export interface PublicProductDetail {
  id: string;
  sku: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  moq: number | null;
  leadTimeDays: number | null;
  tradeTerms: string | null;
  paymentTerms: string | null;
  packagingDetails: string | null;
  customizationSupport: boolean;
  primaryCategory: { id: string; slug: string; name: string };
  additionalCategories: Array<{ id: string; slug: string; name: string }>;
  tags: Array<{ id: string; slug: string; name: string }>;
  featuredImage: PublicProductMediaItem | null;
  galleryImages: PublicProductMediaItem[];
  attachments: Array<{ id: string; url: string; name: string; mimeType: string }>;
  videoLinks: string[];
  attributeGroups: PublicProductAttributeGroup[];
}

// ─── News (Public) ───
export interface PublicNewsListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImage: { url: string; alt: string | null } | null;
  publishedAt: Date | null;
}

export interface PublicNewsListResult {
  items: PublicNewsListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PublicNewsDetail {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content: string | null;
  coverImage: { url: string; alt: string | null } | null;
  publishedAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
}
