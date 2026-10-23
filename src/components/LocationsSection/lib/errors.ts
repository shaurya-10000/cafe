import { POSTGRES_INSUFFICIENT_PRIVILEGE } from "../constants";
import type { LoadErrorKind } from "../types";

/**
 * A permission error is not something a visitor can fix by retrying, so the
 * UI treats it differently from a transient network failure.
 */
export function classifyLoadError(error: unknown): LoadErrorKind {
  const code = (error as { code?: unknown } | null | undefined)?.code;
  return code === POSTGRES_INSUFFICIENT_PRIVILEGE ? "permission" : "network";
}
