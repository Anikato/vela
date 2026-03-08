import { SectionRenderer } from '@/components/website/sections/section-renderer';
import { WebsiteShell } from '@/components/website/layout/website-shell';
import { getDefaultLanguage } from '@/server/services/language.service';
import {
  getPageSectionsForRender,
  getPublishedHomepagePageId,
} from '@/server/services/section.service';

export default async function Home() {
  const defaultLanguage = await getDefaultLanguage();
  const locale = defaultLanguage.code;
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
