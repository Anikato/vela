import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ContactPage } from '@/components/website/contact/contact-page';
import {
  getCachedActiveLanguages,
  getCachedCaptchaSiteKey,
  getCachedDefaultLanguage,
  getCachedPublicContactInfo,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';

export async function generateMetadata(): Promise<Metadata> {
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getCachedDefaultLanguage(),
    getCachedActiveLanguages(),
  ]);
  const locale = defaultLanguage.code;
  const [siteInfo, uiMap] = await Promise.all([
    getCachedPublicSiteInfo(locale, locale),
    getCachedUiTranslationMap(locale, locale, ['contact.title']),
  ]);
  const pageTitle = uiMap['contact.title'] ?? 'Contact Us';
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === locale,
  }));

  return buildSeoMetadata({
    title: `${pageTitle} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    canonicalPath: '/contact',
    locale,
    defaultLocale: locale,
    activeLocales,
    pagePath: '/contact',
    ogImage: siteInfo.ogImageUrl,
  });
}

const UI_KEYS = [
  'nav.home',
  'contact.title',
  'contact.subtitle',
  'contact.nameLabel',
  'contact.namePlaceholder',
  'contact.emailLabel',
  'contact.emailPlaceholder',
  'contact.messageLabel',
  'contact.messagePlaceholder',
  'contact.submitButton',
  'contact.infoTitle',
  'contact.emailInfo',
  'contact.phoneInfo',
  'contact.addressInfo',
  'inquiry.success',
  'inquiry.error',
];

export default async function ContactPageRoute() {
  const defaultLanguage = await getCachedDefaultLanguage();
  const locale = defaultLanguage.code;

  const [contactInfo, siteInfo, uiMap, captchaSiteKey] = await Promise.all([
    getCachedPublicContactInfo(locale, locale),
    getCachedPublicSiteInfo(locale, locale),
    getCachedUiTranslationMap(locale, locale, UI_KEYS),
    getCachedCaptchaSiteKey(),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={locale}>
      <ContactPage
        homeHref="/"
        captchaSiteKey={captchaSiteKey}
        contactInfo={{
          email: contactInfo.email ?? undefined,
          phone: contactInfo.phone ?? undefined,
          address: contactInfo.address ?? undefined,
          whatsapp: contactInfo.whatsapp ?? undefined,
        }}
        uiLabels={{
          home: uiMap['nav.home'] ?? 'Home',
          contact: uiMap['contact.title'] ?? 'Contact Us',
          title: uiMap['contact.title'] ?? 'Contact Us',
          subtitle: uiMap['contact.subtitle'] ?? 'We\'d love to hear from you',
          nameLabel: uiMap['contact.nameLabel'] ?? 'Name',
          namePlaceholder: uiMap['contact.namePlaceholder'] ?? 'Your name',
          emailLabel: uiMap['contact.emailLabel'] ?? 'Email',
          emailPlaceholder: uiMap['contact.emailPlaceholder'] ?? 'your@email.com',
          messageLabel: uiMap['contact.messageLabel'] ?? 'Message',
          messagePlaceholder: uiMap['contact.messagePlaceholder'] ?? 'How can we help you?',
          submitButton: uiMap['contact.submitButton'] ?? 'Send Message',
          successMessage: uiMap['inquiry.success'] ?? 'Message sent successfully!',
          errorMessage: uiMap['inquiry.error'] ?? 'Failed to send message',
          infoTitle: uiMap['contact.infoTitle'] ?? 'Contact Information',
          emailInfo: uiMap['contact.emailInfo'] ?? 'Email',
          phoneInfo: uiMap['contact.phoneInfo'] ?? 'Phone',
          addressInfo: uiMap['contact.addressInfo'] ?? 'Address',
        }}
      />
    </WebsiteShell>
  );
}
