import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from '../rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const config: RateLimitConfig = { windowMs: 10_000, maxRequests: 3 };

  it('allows requests within limit', () => {
    const key = `test-allow-${Date.now()}`;
    const r1 = checkRateLimit(key, config);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);
    expect(r1.retryAfterMs).toBe(0);
  });

  it('tracks remaining count correctly', () => {
    const key = `test-remaining-${Date.now()}`;
    checkRateLimit(key, config);
    const r2 = checkRateLimit(key, config);
    expect(r2.remaining).toBe(1);

    const r3 = checkRateLimit(key, config);
    expect(r3.remaining).toBe(0);
    expect(r3.allowed).toBe(true);
  });

  it('blocks when limit exceeded', () => {
    const key = `test-block-${Date.now()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const blocked = checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('resets after window expires', () => {
    const key = `test-reset-${Date.now()}`;
    checkRateLimit(key, config);
    checkRateLimit(key, config);
    checkRateLimit(key, config);

    const blocked = checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(config.windowMs + 1);

    const afterReset = checkRateLimit(key, config);
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });

  it('isolates different keys', () => {
    const keyA = `test-iso-a-${Date.now()}`;
    const keyB = `test-iso-b-${Date.now()}`;

    checkRateLimit(keyA, config);
    checkRateLimit(keyA, config);
    checkRateLimit(keyA, config);

    const blockedA = checkRateLimit(keyA, config);
    expect(blockedA.allowed).toBe(false);

    const okB = checkRateLimit(keyB, config);
    expect(okB.allowed).toBe(true);
  });

  it('sliding window allows new requests as old ones expire', () => {
    const key = `test-slide-${Date.now()}`;

    checkRateLimit(key, config); // t=0
    vi.advanceTimersByTime(4000);
    checkRateLimit(key, config); // t=4s
    vi.advanceTimersByTime(4000);
    checkRateLimit(key, config); // t=8s — limit reached

    const blocked = checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);

    // first request was at t=0, window is 10s, advance to t=10.001s
    vi.advanceTimersByTime(2001);

    const afterSlide = checkRateLimit(key, config);
    expect(afterSlide.allowed).toBe(true);
  });
});

describe('RATE_LIMITS presets', () => {
  it('LOGIN preset: 10 requests per 15 minutes', () => {
    expect(RATE_LIMITS.LOGIN.maxRequests).toBe(10);
    expect(RATE_LIMITS.LOGIN.windowMs).toBe(15 * 60 * 1000);
  });

  it('INQUIRY preset: 5 requests per 10 minutes', () => {
    expect(RATE_LIMITS.INQUIRY.maxRequests).toBe(5);
    expect(RATE_LIMITS.INQUIRY.windowMs).toBe(10 * 60 * 1000);
  });

  it('UPLOAD preset: 20 requests per minute', () => {
    expect(RATE_LIMITS.UPLOAD.maxRequests).toBe(20);
    expect(RATE_LIMITS.UPLOAD.windowMs).toBe(60 * 1000);
  });
});
