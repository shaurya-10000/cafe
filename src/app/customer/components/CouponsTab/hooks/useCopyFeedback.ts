"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { COPY_FEEDBACK_MS } from "../constants";
import { writeToClipboard } from "../lib/clipboard";
import type { Coupon } from "../types";

/**
 * Copies a coupon code and tracks which coupon shows "Copied!".
 *
 * The feedback is optimistic: it appears as soon as the user clicks,
 * matching the rest of the app's copy UX; a failed write is logged by
 * `writeToClipboard` and the user can simply click again.
 */
export function useCopyFeedback() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clearing the timer on unmount is enough to avoid a late state update.
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const copy = useCallback((coupon: Coupon) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    void writeToClipboard(coupon.code);

    setCopiedId(coupon.id);
    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
      setCopiedId(null);
    }, COPY_FEEDBACK_MS);
  }, []);

  return { copiedId, copy };
}