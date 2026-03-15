// 站点设置表 — 全局配置（单行表）+ 多语言设置
import { pgTable, uuid, varchar, text, integer, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { media } from './media';
import { languages } from './languages';

export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  // Logo & 品牌
  logoId: uuid('logo_id').references(() => media.id),
  logoDarkId: uuid('logo_dark_id').references(() => media.id),
  faviconId: uuid('favicon_id').references(() => media.id),
  ogImageId: uuid('og_image_id').references(() => media.id),
  // 联系方式
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  contactFax: varchar('contact_fax', { length: 50 }),
  // 即时通讯
  whatsapp: varchar('whatsapp', { length: 50 }),
  wechat: varchar('wechat', { length: 100 }),
  telegram: varchar('telegram', { length: 100 }),
  line: varchar('line', { length: 100 }),
  // 社交媒体
  socialFacebook: varchar('social_facebook', { length: 500 }),
  socialLinkedin: varchar('social_linkedin', { length: 500 }),
  socialYoutube: varchar('social_youtube', { length: 500 }),
  socialInstagram: varchar('social_instagram', { length: 500 }),
  socialPinterest: varchar('social_pinterest', { length: 500 }),
  socialAlibaba: varchar('social_alibaba', { length: 500 }),
  // 公司信息
  establishedYear: integer('established_year'),
  businessHours: varchar('business_hours', { length: 200 }),
  timezone: varchar('timezone', { length: 50 }),
  // 地图
  mapCoordinates: varchar('map_coordinates', { length: 100 }),
  mapEmbedCode: text('map_embed_code'),
  // SMTP 邮件
  smtpHost: varchar('smtp_host', { length: 255 }),
  smtpPort: integer('smtp_port'),
  smtpUser: varchar('smtp_user', { length: 255 }),
  smtpPassword: varchar('smtp_password', { length: 255 }), // 加密存储
  smtpFromName: varchar('smtp_from_name', { length: 100 }),
  smtpFromEmail: varchar('smtp_from_email', { length: 255 }),
  notificationEmails: jsonb('notification_emails').$type<string[]>().default([]),
  // 第三方集成
  gaId: varchar('ga_id', { length: 50 }),
  gtmId: varchar('gtm_id', { length: 50 }),
  fbPixelId: varchar('fb_pixel_id', { length: 50 }),
  captchaProvider: varchar('captcha_provider', { length: 20 }), // turnstile
  captchaSiteKey: varchar('captcha_site_key', { length: 255 }),
  captchaSecretKey: varchar('captcha_secret_key', { length: 255 }),
  // 自定义脚本
  headScripts: text('head_scripts'),
  bodyScripts: text('body_scripts'),
  // 翻译 API
  translationApiProvider: varchar('translation_api_provider', { length: 20 }),
  translationApiKey: varchar('translation_api_key', { length: 255 }),
  // 时间戳
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const siteSettingTranslations = pgTable(
  'site_setting_translations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    locale: varchar('locale', { length: 10 })
      .references(() => languages.code, { onDelete: 'cascade' })
      .notNull(),
    siteName: varchar('site_name', { length: 200 }),
    siteDescription: text('site_description'),
    companyName: varchar('company_name', { length: 200 }),
    slogan: varchar('slogan', { length: 500 }),
    address: text('address'),
    footerText: text('footer_text'),
    copyright: varchar('copyright', { length: 500 }),
    contactCta: varchar('contact_cta', { length: 200 }),
    seoKeywords: text('seo_keywords'),
    inquiryAutoReplySubject: varchar('inquiry_auto_reply_subject', { length: 500 }),
    inquiryAutoReplyBody: text('inquiry_auto_reply_body'),
    announcementBarText: text('announcement_bar_text'),
  },
  (table) => [unique().on(table.locale)],
);

// Relations
export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  logo: one(media, { fields: [siteSettings.logoId], references: [media.id], relationName: 'logo' }),
  logoDark: one(media, {
    fields: [siteSettings.logoDarkId],
    references: [media.id],
    relationName: 'logoDark',
  }),
  favicon: one(media, {
    fields: [siteSettings.faviconId],
    references: [media.id],
    relationName: 'favicon',
  }),
  ogImage: one(media, {
    fields: [siteSettings.ogImageId],
    references: [media.id],
    relationName: 'ogImage',
  }),
}));
