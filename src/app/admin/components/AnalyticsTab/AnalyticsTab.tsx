"use client";

import { useMemo } from "react";

import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { LogisticsSplit } from "./components/LogisticsSplit";
import { MetricsGrid } from "./components/MetricsGrid";
import { RevenueChart } from "./components/RevenueChart";
import { DEFAULT_CURRENCY } from "./constants";
import { useChartTheme } from "./hooks/useChartTheme";
import { usePieSummary } from "./hooks/usePieSummary";
import { createCurrencyFormatter } from "./lib/format";
import type { AnalyticsTabProps } from "./types";

export function AnalyticsTab({
  timeRange,
  setTimeRange,
  filteredAnalyticsData,
  pieData,
  onOpenAssistant,
  currency = DEFAULT_CURRENCY,
}: AnalyticsTabProps) {
  const theme = useChartTheme();

  const formatMoney = useMemo(
    () => createCurrencyFormatter(currency),
    [currency],
  );

  const pie = usePieSummary(pieData);

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-20">
      <AnalyticsHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onOpenAssistant={onOpenAssistant}
      />

      <MetricsGrid data={filteredAnalyticsData} formatMoney={formatMoney} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <RevenueChart
          points={filteredAnalyticsData.filtered}
          theme={theme}
          formatMoney={formatMoney}
        />

        <LogisticsSplit entries={pie.entries} total={pie.total} theme={theme} />
      </div>
    </div>
  );
}
