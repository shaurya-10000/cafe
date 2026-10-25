"use client";

import { useMemo } from "react";

import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { BusiestHours } from "./components/BusiestHours";
import { LogisticsSplit } from "./components/LogisticsSplit";
import { MetricsGrid } from "./components/MetricsGrid";
import { RevenueChart } from "./components/RevenueChart";
import { TopItemsCard } from "./components/TopItemsCard";
import { DEFAULT_CURRENCY } from "./constants";
import { useChartTheme } from "./hooks/useChartTheme";
import { usePieSummary } from "./hooks/usePieSummary";
import { createCompactCurrencyFormatter } from "./lib/compact";
import { buildDailySeries, WINDOW_DAYS } from "./lib/daily";
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

  const formatAxis = useMemo(
    () => createCompactCurrencyFormatter(currency),
    [currency],
  );

  const dailyPoints = useMemo(
    () =>
      buildDailySeries(filteredAnalyticsData.filtered, WINDOW_DAYS[timeRange]),
    [filteredAnalyticsData.filtered, timeRange],
  );

  const pie = usePieSummary(pieData);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 pb-20 sm:space-y-6">
      <AnalyticsHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onOpenAssistant={onOpenAssistant}
      />

      <MetricsGrid data={filteredAnalyticsData} formatMoney={formatMoney} />

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <RevenueChart
          points={dailyPoints}
          theme={theme}
          formatMoney={formatMoney}
          formatAxis={formatAxis}
        />

        <LogisticsSplit entries={pie.entries} total={pie.total} theme={theme} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-12">
        <TopItemsCard items={filteredAnalyticsData.topItems ?? []} />

        <BusiestHours hourly={filteredAnalyticsData.hourly ?? []} theme={theme} />
      </div>
    </div>
  );
}
