import { describe, it, expect } from 'vitest';

import { UPLOAD_LIMITS } from '@/lib/constants';
import { ValidationError } from '@/lib/errors';

import {
  ensureMimeTypeAllowed,
  ensureFileSizeAllowed,
  buildBaseDir,
} from '../media.utils';

describe('ensureMimeTypeAllowed', () => {
  it('accepts all allowed image types', () => {
    for (const type of UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES) {
      expect(() => ensureMimeTypeAllowed(type)).not.toThrow();
    }
  });

  it('accepts allowed document types', () => {
    expect(() => ensureMimeTypeAllowed('application/pdf')).not.toThrow();
    expect(() => ensureMimeTypeAllowed('text/plain')).not.toThrow();
  });

  it('rejects unsupported mime types', () => {
    expect(() => ensureMimeTypeAllowed('video/mp4')).toThrow(ValidationError);
    expect(() => ensureMimeTypeAllowed('application/zip')).toThrow(ValidationError);
    expect(() => ensureMimeTypeAllowed('')).toThrow(ValidationError);
  });
});

describe('ensureFileSizeAllowed', () => {
  it('accepts files within the size limit', () => {
    expect(() => ensureFileSizeAllowed(0)).not.toThrow();
    expect(() => ensureFileSizeAllowed(1024)).not.toThrow();
    expect(() => ensureFileSizeAllowed(UPLOAD_LIMITS.MAX_FILE_SIZE)).not.toThrow();
  });

  it('rejects files exceeding the size limit', () => {
    expect(() => ensureFileSizeAllowed(UPLOAD_LIMITS.MAX_FILE_SIZE + 1)).toThrow(ValidationError);
    expect(() => ensureFileSizeAllowed(100 * 1024 * 1024)).toThrow(ValidationError);
  });

  it('includes the MB limit in the error message', () => {
    const limitMB = UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024;
    expect(() => ensureFileSizeAllowed(UPLOAD_LIMITS.MAX_FILE_SIZE + 1)).toThrow(
      `File size exceeds ${limitMB}MB limit`,
    );
  });
});

describe('buildBaseDir', () => {
  it('returns a path starting with uploads/', () => {
    expect(buildBaseDir()).toMatch(/^uploads\//);
  });

  it('includes year and month segments', () => {
    const dir = buildBaseDir();
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    expect(dir).toContain(`${year}/${month}/`);
  });

  it('generates unique directories on each call', () => {
    const dirs = new Set(Array.from({ length: 10 }, () => buildBaseDir()));
    expect(dirs.size).toBe(10);
  });

  it('uses posix separators (no backslashes)', () => {
    expect(buildBaseDir()).not.toContain('\\');
  });
});
