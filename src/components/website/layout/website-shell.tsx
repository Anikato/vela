import { getUiTranslationMap } from '@/server/services/ui-translation.service';
import { CookieConsentBanner } from './cookie-consent-banner';
import { Footer } from './footer';
import { Header } from './header';

interface WebsiteShellProps {
  locale: string;
  defaultLocale: string;
  children: React.ReactNode;
}

export async function WebsiteShell({ locale, defaultLocale, children }: WebsiteShellProps) {
  const ui = await getUiTranslationMap(locale, defaultLocale, [
    'cookie.title',
    'cookie.description',
    'cookie.accept',
    'cookie.reject',
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header locale={locale} defaultLocale={defaultLocale} />
      <div>{children}</div>
      <Footer locale={locale} defaultLocale={defaultLocale} />
      <CookieConsentBanner
        title={ui['cookie.title']}
        description={ui['cookie.description']}
        acceptText={ui['cookie.accept']}
        rejectText={ui['cookie.reject']}
      />
    </div>
  );
}
