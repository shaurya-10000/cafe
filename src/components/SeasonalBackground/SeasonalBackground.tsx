"use client";

import { ParticleField } from "./components";
import {
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_REFRESH_INTERVAL_MS,
  DEFAULT_SEASON_BOUNDARIES,
  DEFAULT_TIMEZONE,
  DEFAULT_Z_INDEX_CLASSNAME,
  NARROW_VIEWPORT_QUERY,
  REDUCED_MOTION_QUERY,
  SEASON_CONFIG,
} from "./constants";
import {
  useAutoSeason,
  useCssKeyframes,
  useDevWarnings,
  useDocumentVisible,
  useMediaQuery,
  useMountedFadeIn,
  useParticles,
} from "./hooks";
import {
  clampParticleCount,
  clampRefreshInterval,
  getBoundariesKey,
  getEffectiveParticleCount,
  resolvePerformanceMode,
  sanitizeBoundaries,
  sanitizePerformanceMode,
  sanitizeSeason,
} from "./lib";
import { buildLayerClassName } from "./styles";
import type { SeasonalBackgroundProps } from "./types";

/**
 * SeasonalBackground
 *
 * Decorative seasonal particle background for React/Next.js.
 *
 * - SSR-safe (renders nothing until mounted), bounded resource usage,
 *   half the particles on narrow viewports.
 * - Live reduced-motion and document-visibility handling.
 * - Automatic calendar season detection with IANA timezone support.
 * - Framer Motion up to 60 particles, CSS keyframes above (`performance="auto"`).
 * - Defensive sanitisation of every prop for JavaScript consumers.
 *
 * The layer is `aria-hidden` and pointer-events-free: it is decorative and
 * must never compete with application content.
 */
export default function SeasonalBackground({
  season: seasonOverride,
  timeZone = DEFAULT_TIMEZONE,
  particleCount = DEFAULT_PARTICLE_COUNT,
  refreshIntervalMs = DEFAULT_REFRESH_INTERVAL_MS,
  performance: performanceMode = "auto",
  seasonBoundaries = DEFAULT_SEASON_BOUNDARIES,
  className = "",
  zIndexClassName = DEFAULT_Z_INDEX_CLASSNAME,
}: SeasonalBackgroundProps = {}) {
  const safeParticleCount = clampParticleCount(particleCount);
  const safeRefreshIntervalMs = clampRefreshInterval(refreshIntervalMs);
  const safeSeasonOverride =
    seasonOverride === undefined ? undefined : sanitizeSeason(seasonOverride);
  const safePerformanceMode = sanitizePerformanceMode(performanceMode);

  // Cheap to recompute; the consumers key off `boundariesKey`, so a fresh array
  // identity each render does not restart anything.
  const safeBoundaries = sanitizeBoundaries(seasonBoundaries);
  const boundariesKey = getBoundariesKey(safeBoundaries);

  const { mounted, visible } = useMountedFadeIn();
  const isNarrowViewport = useMediaQuery(NARROW_VIEWPORT_QUERY, mounted);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY, mounted);
  const documentVisible = useDocumentVisible(mounted);

  const autoSeason = useAutoSeason({
    enabled: mounted && safeSeasonOverride === undefined,
    timeZone,
    boundaries: safeBoundaries,
    boundariesKey,
    refreshIntervalMs: safeRefreshIntervalMs,
  });

  const season = safeSeasonOverride ?? autoSeason;
  const config = SEASON_CONFIG[season];

  const effectiveCount = getEffectiveParticleCount(
    safeParticleCount,
    isNarrowViewport,
  );
  const resolvedPerformanceMode = resolvePerformanceMode(
    safePerformanceMode,
    effectiveCount,
  );

  useDevWarnings({
    particleCount,
    safeParticleCount,
    refreshIntervalMs,
    safeRefreshIntervalMs,
    seasonBoundaries,
    safeBoundariesLength: safeBoundaries.length,
    performanceMode,
    safePerformanceMode,
    seasonOverride,
    effectiveCount,
  });

  useCssKeyframes(resolvedPerformanceMode);

  const particles = useParticles({
    enabled: mounted,
    season,
    effectiveCount,
    config,
  });

  if (!mounted || particles === null) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={buildLayerClassName({ zIndexClassName, visible, className })}
    >
      <ParticleField
        particles={particles}
        config={config}
        mode={resolvedPerformanceMode}
        reduceMotion={prefersReducedMotion}
        documentVisible={documentVisible}
      />
    </div>
  );
}