/**
 * Client-safe type definitions for admin components.
 *
 * Turbopack resolves module dependencies before erasing `import type`,
 * so client components cannot import types from service files that
 * transitively depend on Node.js modules (postgres, node:fs, etc.).
 *
 * This file derives types from the Drizzle schema (safe — no Node.js deps)
 * and re-declares composite interfaces that client components need.
 */

import type {
  languages,
  media,
  users,
  categories,
  categoryTranslations,
  tags,
  tagTranslations,
  products,
  productTranslations,
  pages,
  pageTranslations,
  sections,
  sectionTranslations,
  navigationItems,
  navigationItemTranslations,
  redirects,
  productAttributeGroups,
  productAttributeGroupTranslations,
  productAttributes,
  productAttributeTranslations,
} from '@/server/db/schema';

// ─── Language ───
export type Language = typeof languages.$inferSelect;

// ─── Media ───
export type Media = typeof media.$inferSelect;

// ─── User ───
type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'passwordHash'>;

// ─── Category ───
type Category = typeof categories.$inferSelect;
type CategoryTranslation = typeof categoryTranslations.$inferSelect;
interface CategoryWithTranslations extends Category {
  translations: CategoryTranslation[];
}
export interface CategoryListItem extends CategoryWithTranslations {
  displayName: string;
  parentDisplayName: string | null;
}

// ─── Tag ───
type Tag = typeof tags.$inferSelect;
type TagTranslation = typeof tagTranslations.$inferSelect;
interface TagWithTranslations extends Tag {
  translations: TagTranslation[];
}
export interface TagListItem extends TagWithTranslations {
  displayName: string;
}

// ─── Product ───
export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];
type Product = typeof products.$inferSelect;
type ProductTranslation = typeof productTranslations.$inferSelect;
interface ProductWithRelations extends Product {
  translations: ProductTranslation[];
  additionalCategoryIds: string[];
  tagIds: string[];
  galleryImageIds: string[];
  attachmentIds: string[];
}
export interface ProductListItem extends ProductWithRelations {
  displayName: string;
  primaryCategoryName: string;
}

// ─── Product Attribute ───
type GroupRow = typeof productAttributeGroups.$inferSelect;
type GroupTranslationRow = typeof productAttributeGroupTranslations.$inferSelect;
type AttributeRow = typeof productAttributes.$inferSelect;
type AttributeTranslationRow = typeof productAttributeTranslations.$inferSelect;

export interface ProductOption {
  id: string;
  sku: string;
  slug: string;
  displayName: string;
}

interface ProductAttributeItem extends AttributeRow {
  translations: AttributeTranslationRow[];
  displayName: string;
  displayValue: string;
}

interface ProductAttributeGroupItem extends GroupRow {
  translations: GroupTranslationRow[];
  displayName: string;
  attributes: ProductAttributeItem[];
}

export interface ProductAttributeEditorData {
  product: ProductOption;
  groups: ProductAttributeGroupItem[];
}

// ─── Page ───
type Page = typeof pages.$inferSelect;
type PageTranslation = typeof pageTranslations.$inferSelect;
interface PageWithTranslations extends Page {
  translations: PageTranslation[];
}
export interface PageListItem extends PageWithTranslations {
  displayTitle: string;
}

// ─── Section ───
type Section = typeof sections.$inferSelect;
type SectionTranslation = typeof sectionTranslations.$inferSelect;
interface SectionWithTranslations extends Section {
  translations: SectionTranslation[];
}
export interface SectionListItem extends SectionWithTranslations {
  displayTitle: string;
}

// ─── Navigation ───
type NavigationItem = typeof navigationItems.$inferSelect;
type NavigationItemTranslation = typeof navigationItemTranslations.$inferSelect;
interface NavigationWithTranslations extends NavigationItem {
  translations: NavigationItemTranslation[];
}
export interface NavigationListItem extends NavigationWithTranslations {
  displayLabel: string;
  parentDisplayLabel: string | null;
}

// ─── News ───
export interface NewsListItem {
  id: string;
  slug: string;
  status: string;
  coverImage: { id: string; url: string; alt: string | null } | null;
  publishedAt: Date | null;
  title: string;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminNewsListResult {
  items: NewsListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NewsDetail {
  id: string;
  slug: string;
  status: string;
  coverImageId: string | null;
  publishedAt: Date | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  tagIds: string[];
  translations: Array<{
    id: string;
    locale: string;
    title: string | null;
    summary: string | null;
    content: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
  }>;
}

// ─── Redirect ───
export type Redirect = typeof redirects.$inferSelect;

// ─── Inquiry ───
export const INQUIRY_STATUSES = ['new', 'read', 'replied', 'closed', 'spam'] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export interface InquiryProductSnapshot {
  name: string;
  sku: string;
  imageUrl?: string;
}

export interface InquiryListItem {
  id: string;
  inquiryNumber: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  status: string;
  productCount: number;
  createdAt: Date;
}

export interface InquiryDetail {
  id: string;
  inquiryNumber: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  message: string;
  status: string;
  sourceUrl: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  locale: string | null;
  deviceType: string | null;
  internalNotes: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  products: Array<{
    id: string;
    productId: string | null;
    snapshot: InquiryProductSnapshot;
    quantity: number;
  }>;
}

// ─── Inquiry Form Field ───
export interface FormFieldItem {
  id: string;
  fieldType: string;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  options: string[] | null;
  translations: Array<{
    locale: string;
    label: string | null;
    placeholder: string | null;
    helpText: string | null;
  }>;
}

// ─── Settings ───
export interface SiteSettingsData {
  id: string;
  logoId: string | null;
  logoUrl: string | null;
  logoDarkId: string | null;
  logoDarkUrl: string | null;
  faviconId: string | null;
  faviconUrl: string | null;
  ogImageId: string | null;
  ogImageUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactFax: string | null;
  whatsapp: string | null;
  wechat: string | null;
  telegram: string | null;
  line: string | null;
  socialFacebook: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
  socialPinterest: string | null;
  socialAlibaba: string | null;
  establishedYear: number | null;
  businessHours: string | null;
  timezone: string | null;
  mapCoordinates: string | null;
  mapEmbedCode: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpFromName: string | null;
  smtpFromEmail: string | null;
  notificationEmails: string[];
  gaId: string | null;
  gtmId: string | null;
  fbPixelId: string | null;
  captchaProvider: string | null;
  captchaSiteKey: string | null;
  headScripts: string | null;
  bodyScripts: string | null;
  translationApiProvider: string | null;
  translations: SiteSettingTranslationRow[];
}
export interface SiteSettingTranslationRow {
  locale: string;
  siteName: string | null;
  siteDescription: string | null;
  companyName: string | null;
  slogan: string | null;
  address: string | null;
  footerText: string | null;
  copyright: string | null;
  contactCta: string | null;
  seoKeywords: string | null;
  inquiryAutoReplySubject: string | null;
  inquiryAutoReplyBody: string | null;
  announcementBarText: string | null;
}

// ─── Theme ───
import type { ThemeConfig } from '@/types/theme';

export interface ThemeListItem {
  id: string;
  name: string;
  isActive: boolean;
  isPreset: boolean;
  config: ThemeConfig;
  createdAt: Date;
  updatedAt: Date;
}

// ─── UI Translation ───
export interface UiTranslationRow {
  key: string;
  category: string;
  translations: Record<string, string>;
}
export interface UiTranslationListResult {
  items: UiTranslationRow[];
  total: number;
}
export interface CategoryStat {
  category: string;
  keyCount: number;
  translatedCount: number;
  totalSlots: number;
}

// ─── Translation Stats ───
export interface EntityTranslationStats {
  entity: string;
  label: string;
  totalItems: number;
  activeLanguages: number;
  totalSlots: number;
  translatedSlots: number;
  completionPercent: number;
  byLanguage: Array<{
    locale: string;
    translated: number;
    total: number;
    percent: number;
  }>;
}
export interface TranslationOverview {
  activeLanguages: number;
  entities: EntityTranslationStats[];
  overallPercent: number;
}
