import Link from 'next/link';
import Image from 'next/image';
import { Home } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import {
  getCachedActiveLanguages,
  getCachedNavigationTree,
  getCachedCaptchaSiteKey,
  getCachedPublicFormFields,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';
import type { Language } from '@/server/services/language.service';
import type { WebsiteNavigationNode } from '@/server/services/navigation.service';
import { HeaderActions } from './header-actions';
import { LanguageSwitcher } from './language-switcher';
import { MobileNav } from './mobile-nav';

interface HeaderProps {
  locale: string;
  defaultLocale: string;
}

function DesktopNavItem({ item }: { item: WebsiteNavigationNode }) {
  return (
    <div className="group relative">
      {item.href ? (
        <Link
          href={item.href}
          target={item.openNewTab ? '_blank' : undefined}
          rel={item.openNewTab ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          {item.label}
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground">
          {item.label}
        </span>
      )}

      {item.children.length ? (
        <div className="invisible absolute left-0 top-full z-40 mt-1.5 min-w-48 rounded-xl border border-border/60 bg-popover p-1.5 opacity-0 shadow-lg shadow-black/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
          {item.children.map((child) =>
            child.href ? (
              <Link
                key={child.id}
                href={child.href}
                target={child.openNewTab ? '_blank' : undefined}
                rel={child.openNewTab ? 'noopener noreferrer' : undefined}
                className="block rounded-lg px-3.5 py-2.5 text-sm text-popover-foreground transition-colors hover:bg-accent"
              >
                {child.label}
              </Link>
            ) : (
              <span
                key={child.id}
                className="block rounded-lg px-3.5 py-2.5 text-sm text-muted-foreground"
              >
                {child.label}
              </span>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function mapLocaleOptions(languages: Language[]) {
  return languages.map((item) => ({
    code: item.code,
    nativeName: item.nativeName || item.code,
  }));
}

const HEADER_UI_KEYS = [
  'search.placeholder',
  'inquiry.basketTitle',
  'inquiry.basketEmpty',
  'inquiry.submitInquiry',
  'inquiry.clearAll',
  'common.close',
  'inquiry.formTitle',
  'inquiry.name',
  'inquiry.email',
  'inquiry.phone',
  'inquiry.company',
  'inquiry.country',
  'inquiry.message',
  'inquiry.submit',
  'common.cancel',
  'inquiry.success',
  'inquiry.error',
];

export async function Header({ locale, defaultLocale }: HeaderProps) {
  const [languages, navigationItems, uiMap, siteInfo, captchaSiteKey, customFormFields] = await Promise.all([
    getCachedActiveLanguages(),
    getCachedNavigationTree(locale, defaultLocale),
    getCachedUiTranslationMap(locale, defaultLocale, HEADER_UI_KEYS),
    getCachedPublicSiteInfo(locale, defaultLocale),
    getCachedCaptchaSiteKey(),
    getCachedPublicFormFields(locale, defaultLocale),
  ]);

  const localeOptions = mapLocaleOptions(languages);
  const searchPath = buildLocalizedPath('/search', locale, defaultLocale);
  const homePath = locale === defaultLocale ? '/' : `/${locale}`;

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg backdrop-saturate-150">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href={homePath} aria-label={siteInfo.siteName} className="shrink-0">
            {siteInfo.logoUrl ? (
              <Image
                src={siteInfo.logoUrl}
                alt={siteInfo.siteName}
                width={140}
                height={40}
                className="h-9 w-auto"
                priority
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Home className="h-4 w-4" />
              </span>
            )}
          </Link>
          <nav className="hidden items-center gap-0.5 md:flex">
            {navigationItems.map((item) => (
              <DesktopNavItem key={item.id} item={item} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <HeaderActions
            searchPath={searchPath}
            captchaSiteKey={captchaSiteKey}
            customFormFields={customFormFields}
            uiLabels={{
              searchPlaceholder: uiMap['search.placeholder'] ?? 'Search...',
              basketTitle: uiMap['inquiry.basketTitle'] ?? 'Inquiry Basket',
              basketEmpty: uiMap['inquiry.basketEmpty'] ?? 'Your inquiry basket is empty',
              basketSubmit: uiMap['inquiry.submitInquiry'] ?? 'Submit Inquiry',
              basketClear: uiMap['inquiry.clearAll'] ?? 'Clear All',
              basketClose: uiMap['common.close'] ?? 'Close',
              formTitle: uiMap['inquiry.formTitle'] ?? 'Send Inquiry',
              formName: uiMap['inquiry.name'] ?? 'Name',
              formEmail: uiMap['inquiry.email'] ?? 'Email',
              formPhone: uiMap['inquiry.phone'] ?? 'Phone',
              formCompany: uiMap['inquiry.company'] ?? 'Company',
              formCountry: uiMap['inquiry.country'] ?? 'Country',
              formMessage: uiMap['inquiry.message'] ?? 'Message',
              formSubmit: uiMap['inquiry.submit'] ?? 'Submit',
              formCancel: uiMap['common.cancel'] ?? 'Cancel',
              formSuccess: uiMap['inquiry.success'] ?? 'Inquiry submitted successfully!',
              formError: uiMap['inquiry.error'] ?? 'Failed to submit inquiry',
            }}
          />
          <div className="hidden md:block">
            <LanguageSwitcher locales={localeOptions} defaultLocale={defaultLocale} />
          </div>
        </div>

        <MobileNav items={navigationItems} />
      </div>
    </header>
  );
}
