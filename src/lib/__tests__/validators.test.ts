import { describe, it, expect } from 'vitest';

import { ValidationError } from '../errors';
import {
  normalizeNullableText,
  normalizeSku,
  normalizeSlug,
  normalizeIds,
  ensureValidStatus,
  ensureTranslationHasField,
} from '../validators';

// ─── normalizeNullableText ───

describe('normalizeNullableText', () => {
  it('returns undefined for undefined', () => {
    expect(normalizeNullableText(undefined)).toBeUndefined();
  });

  it('returns null for null', () => {
    expect(normalizeNullableText(null)).toBeNull();
  });

  it('trims and returns non-empty string', () => {
    expect(normalizeNullableText('  hello  ')).toBe('hello');
  });

  it('returns null for whitespace-only string', () => {
    expect(normalizeNullableText('   ')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeNullableText('')).toBeNull();
  });

  it('preserves normal string', () => {
    expect(normalizeNullableText('hello')).toBe('hello');
  });
});

// ─── normalizeSku ───

describe('normalizeSku', () => {
  it('uppercases and trims', () => {
    expect(normalizeSku('  pump-001  ')).toBe('PUMP-001');
  });

  it('handles already uppercase', () => {
    expect(normalizeSku('ABC')).toBe('ABC');
  });

  it('handles mixed case', () => {
    expect(normalizeSku('Pump-X100')).toBe('PUMP-X100');
  });
});

// ─── normalizeSlug ───

describe('normalizeSlug', () => {
  it('lowercases and trims', () => {
    expect(normalizeSlug('  My-Product  ')).toBe('my-product');
  });

  it('handles already lowercase', () => {
    expect(normalizeSlug('water-pump')).toBe('water-pump');
  });
});

// ─── normalizeIds ───

describe('normalizeIds', () => {
  it('returns empty array for undefined', () => {
    expect(normalizeIds(undefined)).toEqual([]);
  });

  it('returns empty array for empty array', () => {
    expect(normalizeIds([])).toEqual([]);
  });

  it('deduplicates IDs', () => {
    const result = normalizeIds(['a', 'b', 'a', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('trims IDs', () => {
    const result = normalizeIds(['  a ', ' b']);
    expect(result).toEqual(['a', 'b']);
  });

  it('filters out empty strings', () => {
    const result = normalizeIds(['a', '', '  ', 'b']);
    expect(result).toEqual(['a', 'b']);
  });

  it('handles combined edge cases', () => {
    const result = normalizeIds(['  a ', 'a', '', ' b ', 'b']);
    expect(result).toEqual(['a', 'b']);
  });
});

// ─── ensureValidStatus ───

describe('ensureValidStatus', () => {
  const allowed = ['draft', 'published', 'archived'] as const;

  it('does nothing for undefined status', () => {
    expect(() => ensureValidStatus(undefined, allowed)).not.toThrow();
  });

  it('does nothing for valid status', () => {
    expect(() => ensureValidStatus('draft', allowed)).not.toThrow();
    expect(() => ensureValidStatus('published', allowed)).not.toThrow();
    expect(() => ensureValidStatus('archived', allowed)).not.toThrow();
  });

  it('throws ValidationError for invalid status', () => {
    expect(() => ensureValidStatus('deleted', allowed, 'product')).toThrow(
      ValidationError,
    );
    expect(() => ensureValidStatus('deleted', allowed, 'product')).toThrow(
      'Invalid product status: deleted',
    );
  });

  it('uses default entity name', () => {
    expect(() => ensureValidStatus('bad', allowed)).toThrow(
      'Invalid Entity status: bad',
    );
  });
});

// ─── ensureTranslationHasField ───

describe('ensureTranslationHasField', () => {
  it('passes when at least one translation has the field', () => {
    const translations = [
      { locale: 'en-US', name: 'Pump' },
      { locale: 'zh-CN', name: '' },
    ];
    expect(() =>
      ensureTranslationHasField(translations, 'name', 'Name required'),
    ).not.toThrow();
  });

  it('throws when no translation has the field', () => {
    const translations = [
      { locale: 'en-US', name: '' },
      { locale: 'zh-CN', name: '   ' },
    ];
    expect(() =>
      ensureTranslationHasField(translations, 'name', 'Name required'),
    ).toThrow(ValidationError);
    expect(() =>
      ensureTranslationHasField(translations, 'name', 'Name required'),
    ).toThrow('Name required');
  });

  it('throws when field is missing entirely', () => {
    const translations = [
      { locale: 'en-US' },
      { locale: 'zh-CN' },
    ];
    expect(() =>
      ensureTranslationHasField(translations, 'name', 'Name required'),
    ).toThrow('Name required');
  });

  it('throws for empty array', () => {
    expect(() =>
      ensureTranslationHasField([], 'name', 'Name required'),
    ).toThrow('Name required');
  });

  it('works with different field names', () => {
    const translations = [{ locale: 'en-US', value: '5.5 kW' }];
    expect(() =>
      ensureTranslationHasField(translations, 'value', 'Value required'),
    ).not.toThrow();
  });
});
