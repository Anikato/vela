import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { buildSeoMetadata, type AlternateLocale } from '@/lib/seo';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { ContactPage } from '@/components/website/contact/contact-page';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getPublicContactInfo, getPublicSiteInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';

interface LocaleContactPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const [defaultLanguage, activeLanguages] = await Promise.all([
    getDefaultLanguage(),
    getActiveLanguages(),
  ]);
  const [siteInfo, uiMap] = await Promise.all([
    getPublicSiteInfo(locale, defaultLanguage.code),
    getUiTranslationMap(locale, defaultLanguage.code, ['contact.title']),
  ]);
  const pageTitle = uiMap['contact.title'] ?? 'Contact Us';
  const activeLocales: AlternateLocale[] = activeLanguages.map((l) => ({
    code: l.code,
    isDefault: l.code === defaultLanguage.code,
  }));

  return buildSeoMetadata({
    title: `${pageTitle} | ${siteInfo.siteName}`,
    siteName: siteInfo.siteName,
    description: siteInfo.siteDescription,
    canonicalPath: `/${locale}/contact`,
    locale,
    defaultLocale: defaultLanguage.code,
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
];

export default async function LocaleContactPage({ params }: LocaleContactPageProps) {
  const { locale } = await params;

  const [activeLanguages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);
  if (!new Set(activeLanguages.map((l) => l.code)).has(locale)) {
    notFound();
  }

  const [contactInfo, uiMap] = await Promise.all([
    getPublicContactInfo(locale, defaultLanguage.code),
    getUiTranslationMap(locale, defaultLanguage.code, UI_KEYS),
  ]);

  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <ContactPage
        homeHref={`/${locale}`}
        contactInfo={{
          email: contactInfo.email ?? undefined,
          phone: contactInfo.phone ?? undefined,
          address: contactInfo.address ?? undefined,
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
          infoTitle: uiMap['contact.infoTitle'] ?? 'Contact Information',
          emailInfo: uiMap['contact.emailInfo'] ?? 'Email',
          phoneInfo: uiMap['contact.phoneInfo'] ?? 'Phone',
          addressInfo: uiMap['contact.addressInfo'] ?? 'Address',
        }}
      />
    </WebsiteShell>
  );
}
