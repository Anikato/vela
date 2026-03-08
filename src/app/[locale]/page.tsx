import { notFound } from 'next/navigation';

import { WebsiteShell } from '@/components/website/layout/website-shell';
import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import {
  getPageSectionsForRender,
  getPublishedHomepagePageId,
} from '@/server/services/section.service';

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;
  const [activeLanguages, defaultLanguage] = await Promise.all([
    getActiveLanguages(),
    getDefaultLanguage(),
  ]);

  const localeSet = new Set(activeLanguages.map((item) => item.code));
  if (!localeSet.has(locale)) {
    notFound();
  }

  const pageId = await getPublishedHomepagePageId();
  if (!pageId) {
    return <main className="min-h-screen" />;
  }

  const sections = await getPageSectionsForRender(pageId, locale, defaultLanguage.code);
  return (
    <WebsiteShell locale={locale} defaultLocale={defaultLanguage.code}>
      <main>
        <SectionRenderer sections={sections} />
      </main>
    </WebsiteShell>
  );
}
