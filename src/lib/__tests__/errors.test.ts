import { describe, it, expect } from 'vitest';

import {
  NotFoundError,
  DuplicateError,
  ForbiddenError,
  ValidationError,
} from '../errors';

describe('NotFoundError', () => {
  it('has correct name and message', () => {
    const err = new NotFoundError('Product', 'abc-123');
    expect(err.name).toBe('NotFoundError');
    expect(err.message).toBe('Product not found: abc-123');
  });

  it('is instanceof Error', () => {
    expect(new NotFoundError('X', '1')).toBeInstanceOf(Error);
  });
});

describe('DuplicateError', () => {
  it('has correct name and message', () => {
    const err = new DuplicateError('Product', 'sku', 'PUMP-001');
    expect(err.name).toBe('DuplicateError');
    expect(err.message).toBe('Product with sku "PUMP-001" already exists');
  });

  it('is instanceof Error', () => {
    expect(new DuplicateError('X', 'y', 'z')).toBeInstanceOf(Error);
  });
});

describe('ForbiddenError', () => {
  it('has correct name and default message', () => {
    const err = new ForbiddenError();
    expect(err.name).toBe('ForbiddenError');
    expect(err.message).toBe('Insufficient permissions');
  });

  it('accepts custom message', () => {
    const err = new ForbiddenError('Cannot delete last admin');
    expect(err.message).toBe('Cannot delete last admin');
  });
});

describe('ValidationError', () => {
  it('has correct name and message', () => {
    const err = new ValidationError('SKU is required');
    expect(err.name).toBe('ValidationError');
    expect(err.message).toBe('SKU is required');
  });
});

describe('error discrimination', () => {
  it('can distinguish error types with instanceof', () => {
    const errors = [
      new NotFoundError('Product', '1'),
      new DuplicateError('Product', 'sku', 'X'),
      new ForbiddenError(),
      new ValidationError('bad input'),
    ];

    expect(errors.filter((e) => e instanceof NotFoundError)).toHaveLength(1);
    expect(errors.filter((e) => e instanceof DuplicateError)).toHaveLength(1);
    expect(errors.filter((e) => e instanceof ForbiddenError)).toHaveLength(1);
    expect(errors.filter((e) => e instanceof ValidationError)).toHaveLength(1);
  });
});
