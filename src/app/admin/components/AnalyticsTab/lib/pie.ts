import type { PieDatum } from "../types";

/**
 * Only non-zero slices get drawn and listed; zero-value slices carry no
 * information and clutter the legend.
 */
export function selectVisiblePieEntries(
  pieData: readonly PieDatum[],
): PieDatum[] {
  return pieData.filter((entry) => entry.value > 0);
}

export function sumPieValues(entries: readonly PieDatum[]): number {
  return entries.reduce(
    (sum, entry) => sum + (Number.isFinite(entry.value) ? entry.value : 0),
    0,
  );
}

export function toPercent(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
