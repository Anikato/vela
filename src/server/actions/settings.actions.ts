'use server';

import { z } from 'zod';

import { auth } from '@/server/auth';
import type { ActionResult } from '@/types';
import {
  getSiteSettings,
  updateSiteSettings,
  updateSmtpSettings,
  updateScriptsSettings,
  upsertSettingTranslation,
  type SiteSettingsData,
} from '@/server/services/settings-admin.service';

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error('未授权');
}

export async function getSiteSettingsAction(): Promise<ActionResult<SiteSettingsData>> {
  try {
    await requireAuth();
    const data = await getSiteSettings();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '获取站点设置失败' };
  }
}

const updateSiteSchema = z.object({
  logoId: z.string().uuid().nullable().optional(),
  logoDarkId: z.string().uuid().nullable().optional(),
  faviconId: z.string().uuid().nullable().optional(),
  ogImageId: z.string().uuid().nullable().optional(),
  contactEmail: z.string().max(255).nullable().optional(),
  contactPhone: z.string().max(50).nullable().optional(),
  contactFax: z.string().max(50).nullable().optional(),
  whatsapp: z.string().max(50).nullable().optional(),
  wechat: z.string().max(100).nullable().optional(),
  telegram: z.string().max(100).nullable().optional(),
  line: z.string().max(100).nullable().optional(),
  socialFacebook: z.string().max(500).nullable().optional(),
  socialLinkedin: z.string().max(500).nullable().optional(),
  socialYoutube: z.string().max(500).nullable().optional(),
  socialInstagram: z.string().max(500).nullable().optional(),
  socialPinterest: z.string().max(500).nullable().optional(),
  socialAlibaba: z.string().max(500).nullable().optional(),
  establishedYear: z.number().int().min(1800).max(2100).nullable().optional(),
  businessHours: z.string().max(200).nullable().optional(),
  timezone: z.string().max(50).nullable().optional(),
  mapCoordinates: z.string().max(100).nullable().optional(),
  mapEmbedCode: z.string().nullable().optional(),
});

export async function updateSiteSettingsAction(
  input: z.infer<typeof updateSiteSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const parsed = updateSiteSchema.parse(input);
    await updateSiteSettings(parsed);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '更新站点设置失败' };
  }
}

const smtpSchema = z.object({
  smtpHost: z.string().max(255).nullable().optional(),
  smtpPort: z.number().int().min(1).max(65535).nullable().optional(),
  smtpUser: z.string().max(255).nullable().optional(),
  smtpPassword: z.string().max(255).nullable().optional(),
  smtpFromName: z.string().max(100).nullable().optional(),
  smtpFromEmail: z.string().max(255).nullable().optional(),
  notificationEmails: z.array(z.string().email()).optional(),
});

export async function updateSmtpSettingsAction(
  input: z.infer<typeof smtpSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const parsed = smtpSchema.parse(input);
    await updateSmtpSettings(parsed);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '更新邮件配置失败' };
  }
}

const scriptsSchema = z.object({
  gaId: z.string().max(50).nullable().optional(),
  gtmId: z.string().max(50).nullable().optional(),
  fbPixelId: z.string().max(50).nullable().optional(),
  headScripts: z.string().nullable().optional(),
  bodyScripts: z.string().nullable().optional(),
});

export async function updateScriptsSettingsAction(
  input: z.infer<typeof scriptsSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const parsed = scriptsSchema.parse(input);
    await updateScriptsSettings(parsed);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '更新脚本配置失败' };
  }
}

const translationSchema = z.object({
  locale: z.string().min(1).max(10),
  siteName: z.string().max(200).nullable().optional(),
  siteDescription: z.string().nullable().optional(),
  companyName: z.string().max(200).nullable().optional(),
  slogan: z.string().max(500).nullable().optional(),
  address: z.string().nullable().optional(),
  footerText: z.string().nullable().optional(),
  copyright: z.string().max(500).nullable().optional(),
  contactCta: z.string().max(200).nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
});

export async function upsertSettingTranslationAction(
  input: z.infer<typeof translationSchema>,
): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    const { locale, ...rest } = translationSchema.parse(input);
    const data = {
      siteName: rest.siteName ?? null,
      siteDescription: rest.siteDescription ?? null,
      companyName: rest.companyName ?? null,
      slogan: rest.slogan ?? null,
      address: rest.address ?? null,
      footerText: rest.footerText ?? null,
      copyright: rest.copyright ?? null,
      contactCta: rest.contactCta ?? null,
      seoKeywords: rest.seoKeywords ?? null,
    };
    await upsertSettingTranslation(locale, data);
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '保存多语言设置失败' };
  }
}

export async function sendTestEmailAction(): Promise<ActionResult<void>> {
  try {
    await requireAuth();
    // TODO: 实际发送测试邮件，依赖 nodemailer 集成
    return { success: false, error: '邮件发送功能尚未配置，请先完善 SMTP 设置' };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '发送测试邮件失败' };
  }
}
