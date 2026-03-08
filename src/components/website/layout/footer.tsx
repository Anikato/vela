import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

import { buildLocalizedPath } from '@/lib/i18n';
import {
  getCachedNavigationTree,
  getCachedPublicSiteInfo,
  getCachedUiTranslationMap,
} from '@/lib/data-cache';

interface FooterProps {
  locale: string;
  defaultLocale: string;
}

const FOOTER_UI_KEYS = [
  'footer.quickLinks',
  'footer.contactUs',
  'footer.followUs',
];

type SocialEntry = { href: string; label: string; d: string };

const SOCIAL_ICON_PATHS: Record<string, string> = {
  facebook:
    'M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z',
  linkedin:
    'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  instagram:
    'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 01-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 017.8 2m-.2 2A3.6 3.6 0 004 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 003.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 110 2.5 1.25 1.25 0 010-2.5M12 7a5 5 0 110 10 5 5 0 010-10m0 2a3 3 0 100 6 3 3 0 000-6z',
  pinterest:
    'M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z',
  alibaba:
    'M21.65 8.955c-.32-.095-.665-.095-.985 0l-4.21 1.33-2.08-3.18a1.16 1.16 0 00-.96-.505h-.83c-.39 0-.75.195-.96.505l-2.08 3.18-4.21-1.33a.98.98 0 00-.985 0 .95.95 0 00-.49.84v5.41c0 .35.19.67.49.84.155.085.325.13.495.13.165 0 .33-.04.49-.13l4.21-1.33 2.08 3.18c.21.31.57.505.96.505h.83c.39 0 .75-.195.96-.505l2.08-3.18 4.21 1.33c.32.095.665.095.985 0a.95.95 0 00.49-.84v-5.41a.95.95 0 00-.49-.84z',
};

function SocialIconSvg({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d={d} />
    </svg>
  );
}

function buildSocialLinks(siteInfo: {
  socialFacebook: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
  socialPinterest: string | null;
  socialAlibaba: string | null;
}): SocialEntry[] {
  const map: [string | null, string, string][] = [
    [siteInfo.socialFacebook, 'Facebook', 'facebook'],
    [siteInfo.socialLinkedin, 'LinkedIn', 'linkedin'],
    [siteInfo.socialYoutube, 'YouTube', 'youtube'],
    [siteInfo.socialInstagram, 'Instagram', 'instagram'],
    [siteInfo.socialPinterest, 'Pinterest', 'pinterest'],
    [siteInfo.socialAlibaba, 'Alibaba', 'alibaba'],
  ];

  return map
    .filter((entry): entry is [string, string, string] => Boolean(entry[0]))
    .map(([href, label, key]) => ({
      href,
      label,
      d: SOCIAL_ICON_PATHS[key],
    }));
}

function WhatsAppFloat({ number }: { number: string }) {
  const clean = number.replace(/[^0-9]/g, '');
  return (
    <a
      href={`https://wa.me/${clean}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

export async function Footer({ locale, defaultLocale }: FooterProps) {
  const [navigationItems, siteInfo, ui] = await Promise.all([
    getCachedNavigationTree(locale, defaultLocale),
    getCachedPublicSiteInfo(locale, defaultLocale),
    getCachedUiTranslationMap(locale, defaultLocale, FOOTER_UI_KEYS),
  ]);

  const quickLinks = navigationItems.filter((item) => Boolean(item.href)).slice(0, 8);
  const socialLinks = buildSocialLinks(siteInfo);
  const homePath = locale === defaultLocale ? '/' : `/${locale}`;

  const hasCompanyInfo = siteInfo.companyName || siteInfo.slogan || siteInfo.footerText;
  const hasContact = siteInfo.contactEmail || siteInfo.contactPhone || siteInfo.address;

  return (
    <>
      <footer className="border-t border-border bg-muted/40">
        {/* Main footer */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Column 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href={homePath} className="inline-block">
                {siteInfo.logoUrl ? (
                  <Image
                    src={siteInfo.logoUrl}
                    alt={siteInfo.siteName}
                    width={140}
                    height={40}
                    className="h-8 w-auto"
                  />
                ) : (
                  <span className="text-lg font-bold text-foreground">
                    {siteInfo.siteName}
                  </span>
                )}
              </Link>

              {hasCompanyInfo && (
                <div className="mt-3 space-y-1">
                  {siteInfo.slogan && (
                    <p className="text-sm text-muted-foreground">{siteInfo.slogan}</p>
                  )}
                  {siteInfo.footerText && (
                    <p className="text-sm text-muted-foreground">{siteInfo.footerText}</p>
                  )}
                </div>
              )}

              {socialLinks.length > 0 && (
                <div className="mt-4">
                  {ui['footer.followUs'] && (
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {ui['footer.followUs']}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.label}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <SocialIconSvg d={social.d} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Column 2: Quick Links */}
            {quickLinks.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {ui['footer.quickLinks'] || 'Quick Links'}
                </h3>
                <ul className="mt-3 space-y-2">
                  {quickLinks.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={item.href!}
                        target={item.openNewTab ? '_blank' : undefined}
                        rel={item.openNewTab ? 'noopener noreferrer' : undefined}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Column 3: Contact */}
            {hasContact && (
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {ui['footer.contactUs'] || 'Contact Us'}
                </h3>
                <ul className="mt-3 space-y-3">
                  {siteInfo.contactEmail && (
                    <li>
                      <a
                        href={`mailto:${siteInfo.contactEmail}`}
                        className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{siteInfo.contactEmail}</span>
                      </a>
                    </li>
                  )}
                  {siteInfo.contactPhone && (
                    <li>
                      <a
                        href={`tel:${siteInfo.contactPhone}`}
                        className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{siteInfo.contactPhone}</span>
                      </a>
                    </li>
                  )}
                  {siteInfo.whatsapp && (
                    <li>
                      <a
                        href={`https://wa.me/${siteInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <MessageCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>WhatsApp</span>
                      </a>
                    </li>
                  )}
                  {siteInfo.address && (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{siteInfo.address}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-border">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-xs text-muted-foreground">
              {siteInfo.copyright
                ? siteInfo.copyright
                : `© ${new Date().getFullYear()} ${siteInfo.companyName || siteInfo.siteName}`}
            </p>
          </div>
        </div>
      </footer>

      {siteInfo.whatsapp && <WhatsAppFloat number={siteInfo.whatsapp} />}
    </>
  );
}
