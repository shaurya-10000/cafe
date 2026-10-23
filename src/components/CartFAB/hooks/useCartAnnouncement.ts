"use client";

import { useEffect, useRef, useState } from "react";
import { ANNOUNCEMENT_DELAY_MS } from "../constants";
import type { AnnouncementFormatters } from "../types";

/**
 * Debounced `aria-live` message for cart count changes.
 *
 * Compares against the *last announced* value, not the last rendered one, so
 * a rapid 3 → 4 → 3 sequence stays silent.
 */
export function useCartAnnouncement(
  count: number,
  formatters: AnnouncementFormatters,
): string {
  const [announcement, setAnnouncement] = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRenderedRef = useRef(count);
  const lastAnnouncedRef = useRef<number | null>(null);
  const formattersRef = useRef(formatters);

  // Declared before the main effect so it always runs first.
  useEffect(() => {
    formattersRef.current = formatters;
  });

  useEffect(() => {
    const previous = previousRenderedRef.current;
    previousRenderedRef.current = count;

    if (count === previous) return;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;

      if (lastAnnouncedRef.current === count) return;
      lastAnnouncedRef.current = count;

      const { update, empty } = formattersRef.current;
      setAnnouncement(count > 0 ? update(count) : empty());
    }, ANNOUNCEMENT_DELAY_MS);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [count]);

  return announcement;
}