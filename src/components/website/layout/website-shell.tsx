import { getCachedActiveTheme, getCachedAnnouncementBarText, getCachedUiTranslationMap } from '@/lib/data-cache';
import { DEFAULT_THEME_CONFIG } from '@/types/theme';
import { getLanguageByCode } from '@/server/services/language.service';
import { AnalyticsScripts } from './analytics-scripts';
import { AnnouncementBar } from './announcement-bar';
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
  const [ui, currentLang, theme, announcementText] = await Promise.all([
    getCachedUiTranslationMap(locale, defaultLocale, [
      'cookie.title',
      'cookie.description',
      'cookie.accept',
      'cookie.reject',
    ]),
    getLanguageByCode(locale),
    getCachedActiveTheme(),
    getCachedAnnouncementBarText(locale, defaultLocale),
  ]);

  const dir = currentLang.isRtl ? 'rtl' : 'ltr';
  const cfg = theme?.config ?? DEFAULT_THEME_CONFIG;
  const bar = cfg.announcementBar;
  const showBar = bar?.enabled && announcementText;

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir} lang={locale}>
      <ThemeStyle />
      {showBar && (
        <AnnouncementBar
          text={announcementText}
          bgColor={bar.bgColor}
          textColor={bar.textColor}
          dismissible={bar.dismissible}
          linkUrl={bar.linkUrl}
        />
      )}
      <Header locale={locale} defaultLocale={defaultLocale} />
      <div className="vt-page-content">{children}</div>
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
