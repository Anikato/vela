import { getLanguageByCode } from '@/server/services/language.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';
import { AnalyticsScripts } from './analytics-scripts';
import { BackToTop } from './back-to-top';
import { CookieConsentBanner } from './cookie-consent-banner';
import { Footer } from './footer';
import { Header } from './header';
import { ThemeStyle } from './theme-provider';

interface WebsiteShellProps {
  locale: string;
  defaultLocale: string;
  children: React.ReactNode;
}

export async function WebsiteShell({ locale, defaultLocale, children }: WebsiteShellProps) {
  const [ui, currentLang] = await Promise.all([
    getUiTranslationMap(locale, defaultLocale, [
      'cookie.title',
      'cookie.description',
      'cookie.accept',
      'cookie.reject',
    ]),
    getLanguageByCode(locale),
  ]);

  const dir = currentLang.isRtl ? 'rtl' : 'ltr';

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir} lang={locale}>
      <ThemeStyle />
      <Header locale={locale} defaultLocale={defaultLocale} />
      <div>{children}</div>
      <Footer locale={locale} defaultLocale={defaultLocale} />
      <CookieConsentBanner
        title={ui['cookie.title']}
        description={ui['cookie.description']}
        acceptText={ui['cookie.accept']}
        rejectText={ui['cookie.reject']}
      />
      <BackToTop />
      <AnalyticsScripts />
    </div>
  );
}
