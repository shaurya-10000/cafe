import { memo } from "react";

import { Award, DollarSign, Receipt, Target, TrendingUp } from "lucide-react";

import { EMPTY_VALUE_LABEL } from "../constants";
import { percentChange } from "../lib/delta";
import { formatCount } from "../lib/format";
import type { CurrencyFormatter, FilteredAnalyticsData } from "../types";
import { MetricCard } from "./MetricCard";

interface MetricsGridProps {
  data: FilteredAnalyticsData;
  formatMoney: CurrencyFormatter;
}

export const MetricsGrid = memo(function MetricsGrid({
  data,
  formatMoney,
}: MetricsGridProps) {
  const previous = data.previous ?? null;

  const averageOrder = data.count > 0 ? data.revenue / data.count : 0;
  const previousAverage =
    previous && previous.count > 0 ? previous.revenue / previous.count : null;

  const revenueDelta = previous
    ? percentChange(data.revenue, previous.revenue)
    : undefined;
  const volumeDelta = previous
    ? percentChange(data.count, previous.count)
    : undefined;
  const averageDelta = previous
    ? percentChange(averageOrder, previousAverage)
    : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
      <MetricCard
        title="Gross Revenue"
        value={formatMoney(data.revenue)}
        sub="Based on selection"
        icon={<DollarSign size={18} aria-hidden="true" />}
        color="blue"
        delta={revenueDelta}
      />

      <MetricCard
        title="Total Volume"
        value={formatCount(data.count)}
        sub="Orders Processed"
        icon={<Target size={18} aria-hidden="true" />}
        color="purple"
        delta={volumeDelta}
      />

      <MetricCard
        title="Avg Order Value"
        value={formatMoney(averageOrder)}
        sub="Per order"
        icon={<Receipt size={18} aria-hidden="true" />}
        color="green"
        delta={averageDelta}
      />

      <MetricCard
        title="Hot Item"
        value={data.topItem ?? EMPTY_VALUE_LABEL}
        sub="Best Seller"
        icon={<Award size={18} aria-hidden="true" />}
        color="orange"
      />

      <MetricCard
        title="Cold Item"
        value={data.leastItem ?? EMPTY_VALUE_LABEL}
        sub="Low Velocity"
        icon={
          <TrendingUp size={18} className="rotate-180" aria-hidden="true" />
        }
        color="red"
        className="col-span-2 lg:col-span-1"
      />
    </div>
  );
});
