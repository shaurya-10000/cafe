/** Coerces any value to an integer >= 1, falling back to `fallback`. */
export function toPositiveInt(value: unknown, fallback = 1): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return fallback;
  }

  return Math.floor(value);
}
