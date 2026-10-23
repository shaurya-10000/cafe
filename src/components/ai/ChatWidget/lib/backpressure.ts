import { AI_RATE_LIMIT_FALLBACK_RETRY_AFTER_SECONDS } from "@/lib/ai/constants";

import {
  MESSAGES,
  UPSTREAM_503_FALLBACK_RETRY_AFTER_SECONDS,
} from "../constants";
import type { BackpressureStatus } from "../types";

/** Seconds to wait: the `Retry-After` header when usable, else a status default. */
export function resolveRetryAfterSeconds(
  header: string | null,
  status: BackpressureStatus,
): number {
  const parsed = header ? Number.parseInt(header, 10) : Number.NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  return status === 429
    ? AI_RATE_LIMIT_FALLBACK_RETRY_AFTER_SECONDS
    : UPSTREAM_503_FALLBACK_RETRY_AFTER_SECONDS;
}

export function getBackpressureMessage(status: BackpressureStatus): string {
  return status === 429 ? MESSAGES.rateLimited : MESSAGES.overloaded;
}