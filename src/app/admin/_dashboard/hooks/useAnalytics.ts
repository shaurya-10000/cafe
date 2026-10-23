import { useMemo } from "react";

import { buildPieData, computeFilteredAnalytics } from "../lib/analytics";
import type {
  FilteredAnalytics,
  OrderRow,
  PieDatum,
  TimeRange,
} from "../types";

export interface UseAnalyticsResult {
  filteredAnalyticsData: FilteredAnalytics;
  pieData: PieDatum[];
}

export function useAnalytics(
  orders: readonly OrderRow[],
  timeRange: TimeRange,
): UseAnalyticsResult {
  const filteredAnalyticsData = useMemo(
    () => computeFilteredAnalytics(orders, timeRange),
    [orders, timeRange],
  );

  const pieData = useMemo(
    () => buildPieData(filteredAnalyticsData.split),
    [filteredAnalyticsData],
  );

  return { filteredAnalyticsData, pieData };
}
