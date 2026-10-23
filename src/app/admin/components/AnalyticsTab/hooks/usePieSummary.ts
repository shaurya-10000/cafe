import { useMemo } from "react";

import { selectVisiblePieEntries, sumPieValues } from "../lib/pie";
import type { PieDatum } from "../types";

export interface UsePieSummaryResult {
  entries: PieDatum[];
  total: number;
  hasData: boolean;
}

export function usePieSummary(pieData: readonly PieDatum[]): UsePieSummaryResult {
  const entries = useMemo(() => selectVisiblePieEntries(pieData), [pieData]);
  const total = useMemo(() => sumPieValues(entries), [entries]);

  return { entries, total, hasData: total > 0 };
}
