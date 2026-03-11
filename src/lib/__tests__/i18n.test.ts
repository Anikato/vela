import { describe, it, expect } from 'vitest';

import { getTranslation, matchLocale, buildLocalizedPath } from '../i18n';

// ─── getTranslation ───

describe('getTranslation', () => {
  const translations = [
    { locale: 'en-US', name: 'Pump' },
    { locale: 'zh-CN', name: '水泵' },
    { locale: 'zh-TW', name: '水泵（繁）' },
    { locale: 'fr-FR', name: 'Pompe' },
    { locale: 'es-ES', name: 'Bomba' },
  ];

  it('returns exact match', () => {
    const result = getTranslation(translations, 'zh-CN', 'en-US');
    expect(result?.name).toBe('水泵');
  });

  it('returns default locale when target not found', () => {
    const result = getTranslation(translations, 'ja-JP', 'en-US');
    expect(result?.name).toBe('Pump');
  });

  it('returns first available when nothing matches', () => {
    const result = getTranslation(translations, 'ja-JP', 'ko-KR');
    expect(result?.name).toBe('Pump');
  });

  it('returns undefined for empty array', () => {
    expect(getTranslation([], 'en-US', 'en-US')).toBeUndefined();
  });

  it('returns undefined for null/undefined input', () => {
    expect(getTranslation(null as never, 'en-US', 'en-US')).toBeUndefined();
  });

  it('falls back to language prefix match (fr → fr-FR)', () => {
    const result = getTranslation(translations, 'fr', 'en-US');
    expect(result?.name).toBe('Pompe');
  });

  it('falls back to language prefix match (fr-CA → fr-FR)', () => {
    const result = getTranslation(translations, 'fr-CA', 'en-US');
    expect(result?.name).toBe('Pompe');
  });

  it('distinguishes zh-CN from zh-TW (script-aware fallback)', () => {
    const withScripts = [
      { locale: 'zh-Hans-CN', name: '简体' },
      { locale: 'zh-Hant-TW', name: '繁體' },
      { locale: 'en-US', name: 'English' },
    ];
    const simplified = getTranslation(withScripts, 'zh-Hans', 'en-US');
    expect(simplified?.name).toBe('简体');

    const traditional = getTranslation(withScripts, 'zh-Hant', 'en-US');
    expect(traditional?.name).toBe('繁體');
  });

  it('prefers exact match over prefix match', () => {
    const result = getTranslation(translations, 'es-ES', 'en-US');
    expect(result?.name).toBe('Bomba');
  });
});

// ─── matchLocale ───

describe('matchLocale', () => {
  const available = ['en-US', 'zh-CN', 'es-ES', 'fr-FR'];

  it('returns exact match from Accept-Language', () => {
    const result = matchLocale('zh-CN,en;q=0.9', available, 'en-US');
    expect(result).toBe('zh-CN');
  });

  it('respects quality values', () => {
    const result = matchLocale('en;q=0.5,es-ES;q=0.9', available, 'en-US');
    expect(result).toBe('es-ES');
  });

  it('falls back to language prefix (zh → zh-CN)', () => {
    const result = matchLocale('zh', available, 'en-US');
    expect(result).toBe('zh-CN');
  });

  it('falls back to language prefix (fr-CA → fr-FR)', () => {
    const result = matchLocale('fr-CA', available, 'en-US');
    expect(result).toBe('fr-FR');
  });

  it('returns default when no match', () => {
    const result = matchLocale('ja-JP,ko-KR', available, 'en-US');
    expect(result).toBe('en-US');
  });

  it('returns default for null Accept-Language', () => {
    expect(matchLocale(null, available, 'en-US')).toBe('en-US');
  });

  it('returns default for empty string', () => {
    expect(matchLocale('', available, 'en-US')).toBe('en-US');
  });

  it('returns default when available list is empty', () => {
    expect(matchLocale('en-US', [], 'en-US')).toBe('en-US');
  });

  it('handles complex Accept-Language header', () => {
    const result = matchLocale(
      'ja-JP;q=0.8, zh-CN;q=0.9, en-US;q=0.7',
      available,
      'en-US',
    );
    expect(result).toBe('zh-CN');
  });
});

// ─── buildLocalizedPath ───

describe('buildLocalizedPath', () => {
  it('returns path without prefix for default locale', () => {
    expect(buildLocalizedPath('/products', 'en-US', 'en-US')).toBe('/products');
  });

  it('adds locale prefix for non-default locale', () => {
    expect(buildLocalizedPath('/products', 'zh-CN', 'en-US')).toBe('/zh-CN/products');
  });

  it('handles root path', () => {
    expect(buildLocalizedPath('/', 'en-US', 'en-US')).toBe('/');
    expect(buildLocalizedPath('/', 'zh-CN', 'en-US')).toBe('/zh-CN/');
  });

  it('adds leading slash if missing', () => {
    expect(buildLocalizedPath('products', 'en-US', 'en-US')).toBe('/products');
    expect(buildLocalizedPath('products', 'zh-CN', 'en-US')).toBe('/zh-CN/products');
  });

  it('handles nested paths', () => {
    expect(
      buildLocalizedPath('/products/pumps/pump-x100', 'fr-FR', 'en-US'),
    ).toBe('/fr-FR/products/pumps/pump-x100');
  });
});
