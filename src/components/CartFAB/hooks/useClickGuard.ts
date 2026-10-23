"use client";

import { useCallback, useRef } from "react";
import type { MouseEvent } from "react";
import { normalizeClickGuardMs } from "../lib/normalize";

/**
 * Monotonic-clock click de-duplication. The timestamp is recorded before the
 * handler runs, so a synchronous throw cannot leave the guard open. When the
 * guard is disabled the timestamp is cleared so a later re-enable never
 * compares against a stale click.
 */
export function useClickGuard(
  clickGuardMs: number,
  onClick: (event: MouseEvent<HTMLButtonElement>) => void,
) {
  const lastClickTimeRef = useRef<number | null>(null);

  return useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const guardMs = normalizeClickGuardMs(clickGuardMs);

      if (guardMs > 0) {
        const now = performance.now();
        const previous = lastClickTimeRef.current;

        if (previous !== null && now - previous < guardMs) {
          return;
        }

        lastClickTimeRef.current = now;
      } else {
        lastClickTimeRef.current = null;
      }

      onClick(event);
    },
    [clickGuardMs, onClick],
  );
}