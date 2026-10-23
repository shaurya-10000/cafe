"use client";

import { useEffect, useRef, useState } from "react";

import { IS_DEV } from "../constants";
import { getCalendarSeason } from "../lib/calendar";
import type { DateBoundary, Season } from "../types";

interface UseAutoSeasonOptions {
  enabled: boolean;
  timeZone: string;
  boundaries: readonly DateBoundary[];
  /** Stable identity for `boundaries`, so inline arrays do not reset the timer. */
  boundariesKey: string;
  refreshIntervalMs: number;
}

/** Calendar-derived season, refreshed on an interval and on tab re-focus. */
export function useAutoSeason({
  enabled,
  timeZone,
  boundaries,
  boundariesKey,
  refreshIntervalMs,
}: UseAutoSeasonOptions): Season {
  const [season, setSeason] = useState<Season>("default");

  const warnedInvalidTzRef = useRef<string | null>(null);
  const boundariesRef = useRef(boundaries);

  // Declared before the main effect so it always runs first.
  useEffect(() => {
    boundariesRef.current = boundaries;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onInvalidTimeZone = !IS_DEV
      ? undefined
      : (tz: string) => {
          if (warnedInvalidTzRef.current === tz) {
            return;
          }

          warnedInvalidTzRef.current = tz;

          console.warn(
            `SeasonalBackground: timeZone="${tz}" is not a valid IANA timezone; ` +
              "falling back to the browser's local date.",
          );
        };

    const update = () => {
      setSeason(
        getCalendarSeason(timeZone, boundariesRef.current, onInvalidTimeZone),
      );
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        update();
      }
    };

    update();

    const interval = window.setInterval(update, refreshIntervalMs);

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, timeZone, boundariesKey, refreshIntervalMs]);

  return season;
}