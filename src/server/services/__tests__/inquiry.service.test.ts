import { describe, it, expect } from 'vitest';

import { generateInquiryNumber } from '../inquiry.utils';

const INQUIRY_STATUSES = ['new', 'read', 'replied', 'closed', 'spam'] as const;

describe('generateInquiryNumber', () => {
  it('starts with INQ- prefix', () => {
    expect(generateInquiryNumber()).toMatch(/^INQ-/);
  });

  it('contains date segment in YYYYMMDD format', () => {
    const num = generateInquiryNumber();
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('');
    expect(num).toContain(expected);
  });

  it('matches the full pattern INQ-YYYYMMDD-XXXXXX', () => {
    expect(generateInquiryNumber()).toMatch(/^INQ-\d{8}-[A-Z0-9]{6}$/);
  });

  it('generates unique numbers', () => {
    const numbers = new Set(Array.from({ length: 50 }, () => generateInquiryNumber()));
    expect(numbers.size).toBe(50);
  });
});

describe('INQUIRY_STATUSES', () => {
  it('contains all expected statuses', () => {
    expect(INQUIRY_STATUSES).toContain('new');
    expect(INQUIRY_STATUSES).toContain('read');
    expect(INQUIRY_STATUSES).toContain('replied');
    expect(INQUIRY_STATUSES).toContain('closed');
    expect(INQUIRY_STATUSES).toContain('spam');
  });

  it('has exactly 5 statuses', () => {
    expect(INQUIRY_STATUSES).toHaveLength(5);
  });
});
