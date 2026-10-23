export { default } from "./SeasonalBackground";
export { default as SeasonalBackground } from "./SeasonalBackground";

export type {
  DateBoundary,
  PerformanceMode,
  Season,
  SeasonalBackgroundProps,
} from "./types";

export {
  AUTO_LOW_THRESHOLD,
  CSS_KEYFRAMES_ID,
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_REFRESH_INTERVAL_MS,
  DEFAULT_SEASON_BOUNDARIES,
  DEFAULT_TIMEZONE,
  DEFAULT_Z_INDEX_CLASSNAME,
  FORCED_HIGH_WARN_THRESHOLD,
  MAX_PARTICLE_COUNT,
  MIN_PARTICLE_COUNT,
  MIN_REFRESH_INTERVAL_MS,
  MOBILE_BREAKPOINT_PX,
  SEASONAL_BACKGROUND_KEYFRAMES_CSS,
  SEASON_CONFIG,
} from "./constants";

export {
  clampParticleCount,
  clampRefreshInterval,
  createParticles,
  dateInRange,
  daysInMonth,
  getBoundariesKey,
  getCalendarSeason,
  getLocalDateParts,
  isPerformanceMode,
  isSeason,
  isValidDateBoundary,
  isValidMonthDay,
  sanitizeBoundaries,
  sanitizePerformanceMode,
  sanitizeSeason,
} from "./lib";