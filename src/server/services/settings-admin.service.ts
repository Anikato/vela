import { eq, and } from 'drizzle-orm';

import { encryptSecret, decryptSecret } from '@/lib/crypto';
import { db } from '@/server/db';
import { siteSettings, siteSettingTranslations } from '@/server/db/schema';
import { getStorageAdapter } from '@/server/storage';

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

function mediaUrl(filename: string | undefined | null): string | null {
  if (!filename) return null;
  const storage = getStorageAdapter();
  return storage.getPublicUrl(filename);
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  let row = await db.query.siteSettings.findFirst({
    with: { logo: true, logoDark: true, favicon: true, ogImage: true },
  });

  if (!row) {
    const [created] = await db.insert(siteSettings).values({}).returning();
    row = { ...created, logo: null, logoDark: null, favicon: null, ogImage: null } as NonNullable<typeof row>;
  }

  const translations = await db.select().from(siteSettingTranslations);

  return {
    id: row!.id,
    logoId: row!.logoId,
    logoUrl: mediaUrl(row!.logo?.filename),
    logoDarkId: row!.logoDarkId,
    logoDarkUrl: mediaUrl(row!.logoDark?.filename),
    faviconId: row!.faviconId,
    faviconUrl: mediaUrl(row!.favicon?.filename),
    ogImageId: row!.ogImageId,
    ogImageUrl: mediaUrl(row!.ogImage?.filename),
    contactEmail: row!.contactEmail,
    contactPhone: row!.contactPhone,
    contactFax: row!.contactFax,
    whatsapp: row!.whatsapp,
    wechat: row!.wechat,
    telegram: row!.telegram,
    line: row!.line,
    socialFacebook: row!.socialFacebook,
    socialLinkedin: row!.socialLinkedin,
    socialYoutube: row!.socialYoutube,
    socialInstagram: row!.socialInstagram,
    socialPinterest: row!.socialPinterest,
    socialAlibaba: row!.socialAlibaba,
    establishedYear: row!.establishedYear,
    businessHours: row!.businessHours,
    timezone: row!.timezone,
    mapCoordinates: row!.mapCoordinates,
    mapEmbedCode: row!.mapEmbedCode,
    smtpHost: row!.smtpHost,
    smtpPort: row!.smtpPort,
    smtpUser: row!.smtpUser,
    smtpFromName: row!.smtpFromName,
    smtpFromEmail: row!.smtpFromEmail,
    notificationEmails: (row!.notificationEmails as string[] | null) ?? [],
    gaId: row!.gaId,
    gtmId: row!.gtmId,
    fbPixelId: row!.fbPixelId,
    captchaProvider: row!.captchaProvider,
    captchaSiteKey: row!.captchaSiteKey,
    headScripts: row!.headScripts,
    bodyScripts: row!.bodyScripts,
    translationApiProvider: row!.translationApiProvider,
    translations: translations.map((t) => ({
      locale: t.locale,
      siteName: t.siteName,
      siteDescription: t.siteDescription,
      companyName: t.companyName,
      slogan: t.slogan,
      address: t.address,
      footerText: t.footerText,
      copyright: t.copyright,
      contactCta: t.contactCta,
      seoKeywords: t.seoKeywords,
      inquiryAutoReplySubject: t.inquiryAutoReplySubject,
      inquiryAutoReplyBody: t.inquiryAutoReplyBody,
      announcementBarText: t.announcementBarText,
    })),
  };
}

export interface UpdateSiteSettingsInput {
  logoId?: string | null;
  logoDarkId?: string | null;
  faviconId?: string | null;
  ogImageId?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactFax?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  telegram?: string | null;
  line?: string | null;
  socialFacebook?: string | null;
  socialLinkedin?: string | null;
  socialYoutube?: string | null;
  socialInstagram?: string | null;
  socialPinterest?: string | null;
  socialAlibaba?: string | null;
  establishedYear?: number | null;
  businessHours?: string | null;
  timezone?: string | null;
  mapCoordinates?: string | null;
  mapEmbedCode?: string | null;
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<void> {
  const existing = await db.query.siteSettings.findFirst();
  if (!existing) {
    await db.insert(siteSettings).values({ ...input, updatedAt: new Date() });
  } else {
    await db
      .update(siteSettings)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(siteSettings.id, existing.id));
  }
}

export interface UpdateSmtpInput {
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPassword?: string | null;
  smtpFromName?: string | null;
  smtpFromEmail?: string | null;
  notificationEmails?: string[];
}

export async function updateSmtpSettings(input: UpdateSmtpInput): Promise<void> {
  const existing = await db.query.siteSettings.findFirst();
  const data: Record<string, unknown> = { ...input, updatedAt: new Date() };
  if (input.notificationEmails !== undefined) {
    data.notificationEmails = input.notificationEmails;
  }
  if (typeof data.smtpPassword === 'string' && data.smtpPassword) {
    data.smtpPassword = encryptSecret(data.smtpPassword as string);
  }
  if (!existing) {
    await db.insert(siteSettings).values(data);
  } else {
    await db.update(siteSettings).set(data).where(eq(siteSettings.id, existing.id));
  }
}

export interface UpdateScriptsInput {
  gaId?: string | null;
  gtmId?: string | null;
  fbPixelId?: string | null;
  captchaSiteKey?: string | null;
  captchaSecretKey?: string | null;
  translationApiKey?: string | null;
  headScripts?: string | null;
  bodyScripts?: string | null;
}

export async function updateScriptsSettings(input: UpdateScriptsInput): Promise<void> {
  const data: Record<string, unknown> = { ...input, updatedAt: new Date() };
  if (input.captchaSiteKey) {
    data.captchaProvider = 'turnstile';
  } else if (input.captchaSiteKey === null) {
    data.captchaProvider = null;
  }

  const existing = await db.query.siteSettings.findFirst();
  if (!existing) {
    await db.insert(siteSettings).values(data);
  } else {
    await db
      .update(siteSettings)
      .set(data)
      .where(eq(siteSettings.id, existing.id));
  }
}

export async function upsertSettingTranslation(
  locale: string,
  data: Omit<SiteSettingTranslationRow, 'locale'>,
): Promise<void> {
  const existing = await db
    .select({ id: siteSettingTranslations.id })
    .from(siteSettingTranslations)
    .where(eq(siteSettingTranslations.locale, locale))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(siteSettingTranslations)
      .set(data)
      .where(eq(siteSettingTranslations.id, existing[0].id));
  } else {
    await db.insert(siteSettingTranslations).values({ locale, ...data });
  }
}

export async function getScriptsForFrontend(): Promise<{
  gaId: string | null;
  gtmId: string | null;
  fbPixelId: string | null;
  headScripts: string | null;
  bodyScripts: string | null;
}> {
  const row = await db.query.siteSettings.findFirst();
  return {
    gaId: row?.gaId ?? null,
    gtmId: row?.gtmId ?? null,
    fbPixelId: row?.fbPixelId ?? null,
    headScripts: row?.headScripts ?? null,
    bodyScripts: row?.bodyScripts ?? null,
  };
}
