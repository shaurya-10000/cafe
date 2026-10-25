/** Percent change from `previous` to `current`; null when there is no baseline. */
export function percentChange(
  current: number,
  previous: number | null,
): number | null {
  if (previous === null || !Number.isFinite(previous) || previous <= 0) {
    return null;
  }
  if (!Number.isFinite(current)) return null;

  return ((current - previous) / previous) * 100;
}

export function formatDelta(delta: number): string {
  const rounded = Math.round(delta);

  return `${rounded >= 0 ? "+" : ""}${rounded}%`;
}
