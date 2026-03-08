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
  address: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  logoUrl: string | null;
  socialFacebook: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
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
      ogImage: true,
    },
  });

  const translations = await db.select().from(siteSettingTranslations);
  const t = getTranslation(translations, locale, defaultLocale);

  return {
    siteName: t?.siteName ?? 'Vela',
    siteDescription: t?.siteDescription ?? null,
    companyName: t?.companyName ?? null,
    slogan: t?.slogan ?? null,
    contactEmail: row?.contactEmail ?? null,
    contactPhone: row?.contactPhone ?? null,
    address: t?.address ?? null,
    seoKeywords: t?.seoKeywords ?? null,
    ogImageUrl: row?.ogImage ? storage.getPublicUrl(row.ogImage.filename) : null,
    logoUrl: row?.logo ? storage.getPublicUrl(row.logo.filename) : null,
    socialFacebook: row?.socialFacebook ?? null,
    socialLinkedin: row?.socialLinkedin ?? null,
    socialYoutube: row?.socialYoutube ?? null,
    socialInstagram: row?.socialInstagram ?? null,
  };
}
