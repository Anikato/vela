import { describe, it, expect } from 'vitest';

describe('TranslateRequest structure', () => {
  it('valid request has texts, from, and to fields', () => {
    const request = {
      texts: ['hello', 'world'],
      from: 'en',
      to: ['zh-Hans', 'ja'],
    };

    expect(request.texts).toHaveLength(2);
    expect(request.from).toBe('en');
    expect(request.to).toEqual(['zh-Hans', 'ja']);
  });

  it('accepts empty arrays for texts and to', () => {
    const request = { texts: [] as string[], from: 'en', to: [] as string[] };
    expect(request.texts).toHaveLength(0);
    expect(request.to).toHaveLength(0);
  });
});

describe('Azure locale code mapping', () => {
  it('splits locale code to get base language', () => {
    const getBaseLanguage = (locale: string) => locale.split('-')[0];
    expect(getBaseLanguage('en-US')).toBe('en');
    expect(getBaseLanguage('zh-Hans')).toBe('zh');
    expect(getBaseLanguage('ja')).toBe('ja');
    expect(getBaseLanguage('pt-BR')).toBe('pt');
  });
});
