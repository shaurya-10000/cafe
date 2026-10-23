"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A boolean that turns on when `start()` is called and turns itself off after
 * `durationMs`. Restarting resets the timer; unmounting clears it.
 */
export function useAutoClearingTimeout(
  durationMs: number,
): [boolean, () => void] {
  const [active, setActive] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setActive(false);
  }, []);

  const start = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    setActive(true);
    timeoutRef.current = setTimeout(() => {
      setActive(false);
      timeoutRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(() => clear, [clear]);

  return [active, start];
}