"use client";

import { useEffect, useRef } from "react";

import {
  FORCED_HIGH_WARN_THRESHOLD,
  IS_DEV,
  MAX_PARTICLE_COUNT,
  MIN_PARTICLE_COUNT,
  MIN_REFRESH_INTERVAL_MS,
} from "../constants";
import { isPerformanceMode, isSeason } from "../lib/validation";
import type { PerformanceMode } from "../types";

interface UseDevWarningsOptions {
  particleCount: number;
  safeParticleCount: number;
  refreshIntervalMs: number;
  safeRefreshIntervalMs: number;
  seasonBoundaries: unknown;
  safeBoundariesLength: number;
  performanceMode: unknown;
  safePerformanceMode: PerformanceMode;
  seasonOverride: unknown;
  effectiveCount: number;
}

/** Development-only diagnostics for invalid or risky props. No-op in production. */
export function useDevWarnings({
  particleCount,
  safeParticleCount,
  refreshIntervalMs,
  safeRefreshIntervalMs,
  seasonBoundaries,
  safeBoundariesLength,
  performanceMode,
  safePerformanceMode,
  seasonOverride,
  effectiveCount,
}: UseDevWarningsOptions): void {
  const warnedInvalidBoundariesRef = useRef(false);
  const warnedForcedHighRef = useRef(false);

  useEffect(() => {
    if (!IS_DEV) {
      return;
    }

    if (particleCount !== safeParticleCount) {
      console.warn(
        `SeasonalBackground: particleCount=${particleCount} is invalid or outside ` +
          `[${MIN_PARTICLE_COUNT}, ${MAX_PARTICLE_COUNT}]; using ${safeParticleCount}.`,
      );
    }

    if (
      !Number.isFinite(refreshIntervalMs) ||
      refreshIntervalMs !== safeRefreshIntervalMs
    ) {
      console.warn(
        `SeasonalBackground: refreshIntervalMs=${refreshIntervalMs} is invalid or below ` +
          `${MIN_REFRESH_INTERVAL_MS}ms; using ${safeRefreshIntervalMs}ms.`,
      );
    }

    if (
      Array.isArray(seasonBoundaries) &&
      safeBoundariesLength !== seasonBoundaries.length &&
      !warnedInvalidBoundariesRef.current
    ) {
      warnedInvalidBoundariesRef.current = true;

      console.warn(
        "SeasonalBackground: one or more season boundaries were invalid and have been ignored.",
      );
    }

    if (!isPerformanceMode(performanceMode)) {
      console.warn(
        `SeasonalBackground: invalid performance mode "${String(
          performanceMode,
        )}"; using "auto".`,
      );
    }

    if (seasonOverride !== undefined && !isSeason(seasonOverride)) {
      console.warn(
        `SeasonalBackground: invalid season "${String(
          seasonOverride,
        )}"; using "default".`,
      );
    }
  }, [
    particleCount,
    safeParticleCount,
    refreshIntervalMs,
    safeRefreshIntervalMs,
    seasonBoundaries,
    safeBoundariesLength,
    performanceMode,
    seasonOverride,
  ]);

  useEffect(() => {
    if (!IS_DEV || warnedForcedHighRef.current) {
      return;
    }

    if (
      safePerformanceMode === "high" &&
      effectiveCount > FORCED_HIGH_WARN_THRESHOLD
    ) {
      warnedForcedHighRef.current = true;

      console.warn(
        `SeasonalBackground: performance="high" is forced with ${effectiveCount} ` +
          `effective particles (> ${FORCED_HIGH_WARN_THRESHOLD}). Consider "auto" or "low".`,
      );
    }
  }, [safePerformanceMode, effectiveCount]);
}