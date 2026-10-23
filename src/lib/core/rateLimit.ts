/**
 * In-memory sliding-window rate limiter for AI routes.
 */

import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  AI_RATE_LIMIT_WINDOW_MS,
} from "./aiRateLimitConstants";

const MAX_TRACKED_KEYS = 10_000;
const SWEEP_AGE_MS = AI_RATE_LIMIT_WINDOW_MS * 2;

interface Bucket {
  count: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, Bucket>();

function evictOldestIfNeeded(): void {
  while (buckets.size > MAX_TRACKED_KEYS) {
    const oldestKey = buckets.keys().next().value;
    if (typeof oldestKey !== "string") break;
    buckets.delete(oldestKey);
  }
}

function toRetryAfterSeconds(msRemaining: number): number {
  return Math.max(1, Math.ceil(msRemaining / 1000));
}

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= AI_RATE_LIMIT_WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    evictOldestIfNeeded();
    return {
      allowed: true,
      remaining: AI_RATE_LIMIT_MAX_REQUESTS - 1,
      retryAfterSeconds: 0,
    };
  }

  if (bucket.count >= AI_RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: toRetryAfterSeconds(
        bucket.windowStart + AI_RATE_LIMIT_WINDOW_MS - now
      ),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: AI_RATE_LIMIT_MAX_REQUESTS - bucket.count,
    retryAfterSeconds: 0,
  };
}

export function __resetRateLimitForTests(): void {
  if (process.env.NODE_ENV === "production") {
    throw new Error("__resetRateLimitForTests must not be called in production.");
  }
  buckets.clear();
}

const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= SWEEP_AGE_MS) {
      buckets.delete(key);
    }
  }
}, AI_RATE_LIMIT_WINDOW_MS);

if (typeof cleanupInterval.unref === "function") {
  cleanupInterval.unref();
}
