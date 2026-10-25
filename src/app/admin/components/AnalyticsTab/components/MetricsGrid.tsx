import { memo } from "react";

import { Award, DollarSign, Target, TrendingUp } from "lucide-react";

import { EMPTY_VALUE_LABEL } from "../constants";
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
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <MetricCard
        title="Gross Revenue"
        value={formatMoney(data.revenue)}
        sub="Based on selection"
        icon={<DollarSign size={18} aria-hidden="true" />}
        color="blue"
      />

      <MetricCard
        title="Total Volume"
        value={formatCount(data.count)}
        sub="Orders Processed"
        icon={<Target size={18} aria-hidden="true" />}
        color="purple"
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
      />
    </div>
  );
});
