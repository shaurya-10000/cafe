"use client";

import { useEffect, useMemo, useState } from "react";

import { useSupabaseClient } from "@/utils/supabase/client";

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
import type {
  AnalyticsTabProps,
  FilteredAnalyticsData,
  PieDatum,
} from "./types";

const SPLIT_COLORS: Record<string, { label: string; color: string }> = {
  deliveryOnline: { label: "Delivery · Online", color: "#3b82f6" },
  deliveryInPerson: { label: "Delivery · In Person", color: "#60a5fa" },
  pickupOnline: { label: "Pickup · Online", color: "#10b981" },
  pickupInPerson: { label: "Pickup · In Person", color: "#34d399" },
  scheduledOnline: { label: "Scheduled · Online", color: "#8b5cf6" },
  scheduledInPerson: { label: "Scheduled · In Person", color: "#a78bfa" },
};

export function AnalyticsTab({
  timeRange,
  setTimeRange,
  filteredAnalyticsData,
  pieData,
  onOpenAssistant,
  currency = DEFAULT_CURRENCY,
}: AnalyticsTabProps) {
  const supabase = useSupabaseClient();
  const theme = useChartTheme();
  const [rpcData, setRpcData] = useState<FilteredAnalyticsData | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc("get_analytics_summary", { p_days: WINDOW_DAYS[timeRange] })
      .then(({ data, error }) => {
        if (!cancelled && !error && data && typeof data === "object") {
          setRpcData(data as FilteredAnalyticsData);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [supabase, timeRange]);

  const activeData = rpcData ?? filteredAnalyticsData;

  const activePieData = useMemo<readonly PieDatum[]>(() => {
    if (!rpcData?.split) return pieData;
    return Object.entries(rpcData.split).map(([key, value]) => ({
      name: SPLIT_COLORS[key]?.label ?? key,
      value: Number(value ?? 0),
      color: SPLIT_COLORS[key]?.color ?? "#6b7280",
    }));
  }, [pieData, rpcData]);

  const formatMoney = useMemo(
    () => createCurrencyFormatter(currency),
    [currency],
  );

  const formatAxis = useMemo(
    () => createCompactCurrencyFormatter(currency),
    [currency],
  );

  const dailyPoints = useMemo(
    () => buildDailySeries(activeData.filtered, WINDOW_DAYS[timeRange]),
    [activeData.filtered, timeRange],
  );

  const pie = usePieSummary(activePieData);

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-4 pb-20 sm:space-y-6">
      <AnalyticsHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onOpenAssistant={onOpenAssistant}
      />

      <MetricsGrid data={activeData} formatMoney={formatMoney} />

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
        <TopItemsCard items={activeData.topItems ?? []} />

        <BusiestHours hourly={activeData.hourly ?? []} theme={theme} />
      </div>
    </div>
  );
}