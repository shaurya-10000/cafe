import {
  DEFAULT_PARTICLE_COUNT,
  DEFAULT_REFRESH_INTERVAL_MS,
  DEFAULT_SEASON_BOUNDARIES,
  MAX_PARTICLE_COUNT,
  MIN_PARTICLE_COUNT,
  MIN_REFRESH_INTERVAL_MS,
} from "../constants";
import type {
  DateBoundary,
  MonthDay,
  PerformanceMode,
  Season,
} from "../types";

export function isSeason(value: unknown): value is Season {
  return (
    value === "halloween" ||
    value === "christmas" ||
    value === "newyear" ||
    value === "default"
  );
}

export function isPerformanceMode(value: unknown): value is PerformanceMode {
  return value === "auto" || value === "high" || value === "low";
}

/** Leap-year-tolerant: February allows 29 so Feb 29 boundaries are valid. */
export function daysInMonth(month: number): number {
  switch (month) {
    case 2:
      return 29;

    case 4:
    case 6:
    case 9:
    case 11:
      return 30;

    default:
      return 31;
  }
}

export function isValidMonthDay(value: unknown): value is MonthDay {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { month?: unknown; day?: unknown };

  if (
    typeof candidate.month !== "number" ||
    typeof candidate.day !== "number"
  ) {
    return false;
  }

  if (!Number.isInteger(candidate.month) || !Number.isInteger(candidate.day)) {
    return false;
  }

  if (candidate.month < 1 || candidate.month > 12) {
    return false;
  }

  return candidate.day >= 1 && candidate.day <= daysInMonth(candidate.month);
}

export function isValidDateBoundary(value: unknown): value is DateBoundary {
  if (!value || typeof value !== "object") {
    return false;
  }

  const boundary = value as Partial<DateBoundary>;

  if (
    boundary.season !== "halloween" &&
    boundary.season !== "christmas" &&
    boundary.season !== "newyear"
  ) {
    return false;
  }

  if (!isValidMonthDay(boundary.start) || !isValidMonthDay(boundary.end)) {
    return false;
  }

  const start = boundary.start.month * 100 + boundary.start.day;
  const end = boundary.end.month * 100 + boundary.end.day;

  return start <= end;
}

export function sanitizeSeason(value: unknown): Season {
  return isSeason(value) ? value : "default";
}

export function sanitizePerformanceMode(value: unknown): PerformanceMode {
  return isPerformanceMode(value) ? value : "auto";
}

export function sanitizeBoundaries(value: unknown): readonly DateBoundary[] {
  if (!Array.isArray(value)) {
    return DEFAULT_SEASON_BOUNDARIES;
  }

  return value.filter(isValidDateBoundary);
}

export function clampParticleCount(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PARTICLE_COUNT;
  }

  return Math.min(
    Math.max(Math.floor(value), MIN_PARTICLE_COUNT),
    MAX_PARTICLE_COUNT,
  );
}

export function clampRefreshInterval(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_REFRESH_INTERVAL_MS;
  }

  return Math.max(value, MIN_REFRESH_INTERVAL_MS);
}