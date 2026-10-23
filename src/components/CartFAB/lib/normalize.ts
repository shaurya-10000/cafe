function toNonNegativeInt(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

/** NaN / negative / Infinity → 0, fractional floored. */
export function normalizeCount(value: number): number {
  return toNonNegativeInt(value);
}

export function normalizeClickGuardMs(value: number): number {
  return toNonNegativeInt(value);
}