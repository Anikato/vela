/**
 * 内存级滑动窗口限流器
 * 适用于单实例部署；多实例场景需改用 Redis。
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

/**
 * 检查某个 key（通常是 IP）是否超限。
 * 返回 { allowed, remaining, retryAfterMs }。
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldest + config.windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

/** 预置限流配置 */
export const RATE_LIMITS = {
  /** 登录：每 IP 每 15 分钟最多 10 次 */
  LOGIN: { windowMs: 15 * 60 * 1000, maxRequests: 10 },
  /** 询盘提交：每 IP 每 10 分钟最多 5 次 */
  INQUIRY: { windowMs: 10 * 60 * 1000, maxRequests: 5 },
  /** 文件上传：每 IP 每分钟最多 20 次 */
  UPLOAD: { windowMs: 60 * 1000, maxRequests: 20 },
} as const;
