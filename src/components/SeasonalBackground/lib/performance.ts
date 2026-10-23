import { AUTO_LOW_THRESHOLD } from "../constants";
import type { PerformanceMode, ResolvedPerformanceMode } from "../types";

/** Narrow viewports render half the particles. */
export function getEffectiveParticleCount(
  particleCount: number,
  isNarrowViewport: boolean,
): number {
  return isNarrowViewport ? Math.ceil(particleCount / 2) : particleCount;
}

export function resolvePerformanceMode(
  mode: PerformanceMode,
  effectiveCount: number,
): ResolvedPerformanceMode {
  if (mode !== "auto") {
    return mode;
  }

  return effectiveCount > AUTO_LOW_THRESHOLD ? "low" : "high";
}