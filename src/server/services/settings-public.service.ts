import { getTranslation } from '@/lib/i18n';
import { db } from '@/server/db';
import { siteSettingTranslations } from '@/server/db/schema';

export interface PublicContactInfo {
  email: string | null;
  phone: string | null;
  address: string | null;
  whatsapp: string | null;
}

export interface PublicSiteInfo {
  siteName: string;
  siteDescription: string | null;
  companyName: string | null;
  slogan: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactFax: string | null;
  address: string | null;
  whatsapp: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  footerText: string | null;
  copyright: string | null;
  contactCta: string | null;
  socialFacebook: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
  socialPinterest: string | null;
  socialAlibaba: string | null;
}

const DEFAULT_SITE_NAME = 'Vela';

/** 获取站点名称（取第一条翻译的 siteName，供后台等不需要多语言的场景使用） */
export async function getSiteName(): Promise<string> {
  const row = await db
    .select({ siteName: siteSettingTranslations.siteName })
    .from(siteSettingTranslations)
    .limit(1);
  return row[0]?.siteName || DEFAULT_SITE_NAME;
}

/** 获取 favicon URL（供根布局 metadata.icons 使用） */
export async function getFaviconUrl(): Promise<string | null> {
  const row = await db.query.siteSettings.findFirst({
    with: { favicon: true },
  });
  if (!row?.favicon) return null;
  const { getStorageAdapter } = await import('@/server/storage');
  return getStorageAdapter().getPublicUrl(row.favicon.filename);
}

export interface InquiryAutoReplyTemplate {
  subject: string | null;
  body: string | null;
}

/** 获取指定 locale 的询盘自动回复模板（含回退链） */
export async function getInquiryAutoReplyTemplate(
  locale: string,
  defaultLocale: string,
): Promise<InquiryAutoReplyTemplate> {
  const translations = await db.select().from(siteSettingTranslations);
  const t = getTranslation(translations, locale, defaultLocale);
  return {
    subject: t?.inquiryAutoReplySubject ?? null,
    body: t?.inquiryAutoReplyBody ?? null,
  };
}

/** 获取面向前台的联系信息（从 site_settings 单行表读取） */
export async function getPublicContactInfo(
  locale: string,
  defaultLocale: string,
): Promise<PublicContactInfo> {
  const row = await db.query.siteSettings.findFirst();
  if (!row) {
    return { email: null, phone: null, address: null, whatsapp: null };
  }

  const translations = await db.select().from(siteSettingTranslations);
  const translated = getTranslation(translations, locale, defaultLocale);

  return {
    email: row.contactEmail ?? null,
    phone: row.contactPhone ?? null,
    address: translated?.address ?? null,
    whatsapp: row.whatsapp ?? null,
  };
}

/** 获取面向 SEO 和前台的站点公共信息 */
export async function getPublicSiteInfo(
  locale: string,
  defaultLocale: string,
): Promise<PublicSiteInfo> {
  const { getStorageAdapter } = await import('@/server/storage');
  const storage = getStorageAdapter();

  const row = await db.query.siteSettings.findFirst({
    with: {
      logo: true,
      logoDark: true,
      ogImage: true,
    },
  });

  const translations = await db.select().from(siteSettingTranslations);
  const t = getTranslation(translations, locale, defaultLocale);

  return {
    siteName: t?.siteName ?? DEFAULT_SITE_NAME,
    siteDescription: t?.siteDescription ?? null,
    companyName: t?.companyName ?? null,
    slogan: t?.slogan ?? null,
    contactEmail: row?.contactEmail ?? null,
    contactPhone: row?.contactPhone ?? null,
    contactFax: row?.contactFax ?? null,
    address: t?.address ?? null,
    whatsapp: row?.whatsapp ?? null,
    seoKeywords: t?.seoKeywords ?? null,
    ogImageUrl: row?.ogImage ? storage.getPublicUrl(row.ogImage.filename) : null,
    logoUrl: row?.logo ? storage.getPublicUrl(row.logo.filename) : null,
    logoDarkUrl: row?.logoDark ? storage.getPublicUrl(row.logoDark.filename) : null,
    footerText: t?.footerText ?? null,
    copyright: t?.copyright ?? null,
    contactCta: t?.contactCta ?? null,
    socialFacebook: row?.socialFacebook ?? null,
    socialLinkedin: row?.socialLinkedin ?? null,
    socialYoutube: row?.socialYoutube ?? null,
    socialInstagram: row?.socialInstagram ?? null,
    socialPinterest: row?.socialPinterest ?? null,
    socialAlibaba: row?.socialAlibaba ?? null,
  };
}

export async function getAnnouncementBarText(
  locale: string,
  defaultLocale: string,
): Promise<string | null> {
  const translations = await db.select().from(siteSettingTranslations);
  const t = getTranslation(translations, locale, defaultLocale);
  return t?.announcementBarText ?? null;
}
