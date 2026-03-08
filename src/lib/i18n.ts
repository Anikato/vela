/**
 * 多语言工具函数
 * 处理翻译回退、语言检测等
 */

interface TranslationRecord {
  locale: string;
  [key: string]: unknown;
}

function parseLocaleParts(locale: string): { language: string; script?: string; region?: string } {
  const parts = locale.split('-').filter(Boolean);
  const language = parts[0]?.toLowerCase() ?? '';
  let script: string | undefined;
  let region: string | undefined;

  for (const part of parts.slice(1)) {
    if (/^[A-Za-z]{4}$/.test(part)) {
      script = `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`;
      continue;
    }
    if (/^[A-Za-z]{2}$/.test(part) || /^[0-9]{3}$/.test(part)) {
      region = part.toUpperCase();
    }
  }

  return { language, script, region };
}

/**
 * 从翻译数组中按回退链找到最佳匹配的翻译
 * 回退链：精确匹配 → 前缀匹配 → 默认语言 → 第一个可用
 */
export function getTranslation<T extends TranslationRecord>(
  translations: T[],
  targetLocale: string,
  defaultLocale: string,
): T | undefined {
  if (!translations || translations.length === 0) return undefined;

  // 1. 精确匹配
  const exact = translations.find((t) => t.locale === targetLocale);
  if (exact) return exact;

  // 2. 语言+脚本匹配（避免 zh 简繁混退）
  const target = parseLocaleParts(targetLocale);
  if (target.script) {
    const languageScriptMatch = translations.find((t) => {
      const current = parseLocaleParts(t.locale);
      return current.language === target.language && current.script === target.script;
    });
    if (languageScriptMatch) return languageScriptMatch;
  }

  // 3. 语言前缀匹配（如 fr-CA -> fr-FR）
  const languageMatch = translations.find((t) => {
    const current = parseLocaleParts(t.locale);
    return current.language === target.language;
  });
  if (languageMatch) return languageMatch;

  // 4. 默认语言
  const defaultMatch = translations.find((t) => t.locale === defaultLocale);
  if (defaultMatch) return defaultMatch;

  // 5. 第一个可用
  return translations[0];
}

/**
 * 根据 Accept-Language 头部选择最佳语言
 */
export function matchLocale(
  acceptLanguage: string | null,
  availableLocales: string[],
  defaultLocale: string,
): string {
  if (!acceptLanguage || availableLocales.length === 0) return defaultLocale;

  // 解析 Accept-Language: en-US,en;q=0.9,zh-CN;q=0.8
  const requested = acceptLanguage
    .split(',')
    .map((part) => {
      const [locale, qPart] = part.trim().split(';');
      const q = qPart ? parseFloat(qPart.split('=')[1]) : 1;
      return { locale: locale.trim(), q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { locale } of requested) {
    const target = parseLocaleParts(locale);

    // 精确匹配
    if (availableLocales.includes(locale)) return locale;

    // 语言+脚本匹配
    if (target.script) {
      const languageScriptMatch = availableLocales.find((candidate) => {
        const current = parseLocaleParts(candidate);
        return current.language === target.language && current.script === target.script;
      });
      if (languageScriptMatch) return languageScriptMatch;
    }

    // 语言前缀匹配
    const languageMatch = availableLocales.find((candidate) => {
      const current = parseLocaleParts(candidate);
      return current.language === target.language;
    });
    if (languageMatch) return languageMatch;
  }

  return defaultLocale;
}

/**
 * 构建带语言前缀的 URL 路径
 * 默认语言无前缀，非默认语言带前缀
 */
export function buildLocalizedPath(
  path: string,
  locale: string,
  defaultLocale: string,
): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === defaultLocale) return cleanPath;
  return `/${locale}${cleanPath}`;
}
