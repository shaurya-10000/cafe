import { memo, useId } from "react";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_ACCENT } from "../constants";
import { formatChartDate, toChartNumber } from "../lib/format";
import type {
  AnalyticsChartPoint,
  ChartTheme,
  CurrencyFormatter,
} from "../types";
import { EmptyChartState } from "./EmptyChartState";

interface RevenueChartProps {
  points: AnalyticsChartPoint[];
  theme: ChartTheme;
  formatMoney: CurrencyFormatter;
}

export const RevenueChart = memo(function RevenueChart({
  points,
  theme,
  formatMoney,
}: RevenueChartProps) {
  // Unique per instance so two charts on a page never share a gradient.
  // Colons are not valid inside `url(#...)` references in every browser.
  const gradientId = `revenue-gradient-${useId().replace(/:/g, "")}`;

  return (
    <div className="min-w-0 rounded-3xl border border-cafe-border bg-cafe-card p-5 sm:rounded-[2.5rem] sm:p-8 lg:col-span-8">
      <div className="mb-5 flex items-center justify-between sm:mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest text-cafe-accent">
          Revenue Trajectory
        </span>

        <div
          aria-hidden="true"
          className="h-2 w-2 animate-pulse rounded-full bg-cafe-accent"
        />
      </div>

      <div className="h-[260px] sm:h-[350px]">
        {points.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_ACCENT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                vertical={false}
              />

              <XAxis dataKey="created_at" hide />

              <YAxis
                stroke={theme.axisColor}
                fontSize={10}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={theme.tooltipContentStyle}
                labelStyle={{ color: theme.tooltipLabelColor }}
                itemStyle={{ color: CHART_ACCENT, fontWeight: "bold" }}
                formatter={(value) => [
                  formatMoney(toChartNumber(value)),
                  "Revenue",
                ]}
                labelFormatter={(label) => formatChartDate(label)}
              />

              <Area
                type="monotone"
                dataKey="total_amount"
                stroke={CHART_ACCENT}
                strokeWidth={3}
                fill={`url(#${gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label="No orders in this period" />
        )}
      </div>
    </div>
  );
});
