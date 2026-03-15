import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { UPLOAD_LIMITS } from '@/lib/constants';
import { ValidationError } from '@/lib/errors';

export function ensureMimeTypeAllowed(mimeType: string): void {
  if (!UPLOAD_LIMITS.ALLOWED_UPLOAD_TYPES.includes(mimeType as (typeof UPLOAD_LIMITS.ALLOWED_UPLOAD_TYPES)[number])) {
    throw new ValidationError('Unsupported file type');
  }
}

export function ensureFileSizeAllowed(size: number): void {
  if (size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
    throw new ValidationError(`File size exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }
}

export function buildBaseDir(): string {
  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return path.posix.join('uploads', year, month, randomUUID());
}
