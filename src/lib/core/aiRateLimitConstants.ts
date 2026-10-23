/**
 * Single source of truth for AI-surface rate-limit constants.
 *
 * Why this file exists
 * ────────────────────
 * Three call sites previously declared their own copy of these numbers:
 *
 *   - `src/lib/rateLimit.ts`      (server: WINDOW_MS / MAX_REQUESTS)
 *   - `ChatWidget.tsx`            (client: RATE_LIMIT_WINDOW_MS / RATE_LIMIT_MAX_SENDS)
 *   - the AI routes' Retry-After fallback (`?? 60`)
 *
 * The client copies existed only to give the user a *local* pre-flight
 * check ("don't even send this, you're over budget") so they don't have
 * to wait for a round-trip to learn they're throttled. That's a real
 * product value, but it only holds if the two budgets are identical —
 * a client budget *lower* than the server's silently rejects sends the
 * server would have accepted, and a client budget *higher* than the
 * server's makes the local check useless (the user gets a 429 anyway,
 * which is exactly the round-trip the local check exists to avoid).
 *
 * This module is imported by BOTH sides. If the numbers ever diverge
 * again it will be because someone edited this file and forgot to
 * redeploy one side, not because two independent files drifted.
 *
 * Why `as const`
 * ──────────────
 * The `Retry-After` computation on the server (`Math.ceil((windowStart
 * + WINDOW_MS - now) / 1000)`) and the client's countdown timer
 * (`setCooldownSeconds(retryAfter)`) both want these as literal
 * numbers, not `number`. `as const` gives them that without an
 * explicit `: 60_000` annotation at every call site.
 */

export const AI_RATE_LIMIT_WINDOW_MS = 60_000 as const;
export const AI_RATE_LIMIT_MAX_REQUESTS = 20 as const;
export const AI_RATE_LIMIT_FALLBACK_RETRY_AFTER_SECONDS = 60 as const;
