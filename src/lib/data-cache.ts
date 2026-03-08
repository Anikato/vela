import { cache } from 'react';

import { getActiveLanguages, getDefaultLanguage } from '@/server/services/language.service';
import { getWebsiteNavigationTree } from '@/server/services/navigation.service';
import { getPublicSiteInfo, getPublicContactInfo } from '@/server/services/settings-public.service';
import { getUiTranslationMap } from '@/server/services/ui-translation.service';
import { getCaptchaSiteKey } from '@/server/services/captcha.service';
import { getPublicFormFields } from '@/server/services/inquiry-form-field.service';
import { getScriptsForFrontend } from '@/server/services/settings-admin.service';

export const getCachedActiveLanguages = cache(() => getActiveLanguages());

export const getCachedDefaultLanguage = cache(() => getDefaultLanguage());

export const getCachedNavigationTree = cache(
  (locale: string, defaultLocale: string) => getWebsiteNavigationTree(locale, defaultLocale),
);

export const getCachedPublicSiteInfo = cache(
  (locale: string, defaultLocale: string) => getPublicSiteInfo(locale, defaultLocale),
);

export const getCachedPublicContactInfo = cache(
  (locale: string, defaultLocale: string) => getPublicContactInfo(locale, defaultLocale),
);

export const getCachedUiTranslationMap = cache(
  (locale: string, defaultLocale: string, keys: string[]) => getUiTranslationMap(locale, defaultLocale, keys),
);

export const getCachedCaptchaSiteKey = cache(() => getCaptchaSiteKey());

export const getCachedPublicFormFields = cache(
  (locale: string, defaultLocale: string) => getPublicFormFields(locale, defaultLocale),
);

export const getCachedScriptsForFrontend = cache(() => getScriptsForFrontend());
