import { memo, useMemo } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CHART_ACCENT } from "../constants";
import { formatCount, toChartNumber } from "../lib/format";
import type { ChartTheme, HourBucket } from "../types";
import { EmptyChartState } from "./EmptyChartState";

interface BusiestHoursProps {
  hourly: readonly HourBucket[];
  theme: ChartTheme;
}

function hourLabel(hour: number): string {
  const display = hour % 12 === 0 ? 12 : hour % 12;

  return `${display}${hour < 12 ? "a" : "p"}`;
}

export const BusiestHours = memo(function BusiestHours({
  hourly,
  theme,
}: BusiestHoursProps) {
  const data = useMemo(
    () => hourly.map((bucket) => ({ label: hourLabel(bucket.hour), orders: bucket.orders })),
    [hourly],
  );

  const peak = useMemo(
    () =>
      hourly.reduce<HourBucket | null>(
        (best, bucket) => (bucket.orders > (best?.orders ?? 0) ? bucket : best),
        null,
      ),
    [hourly],
  );

  return (
    <div className="min-w-0 rounded-3xl border border-cafe-border bg-cafe-card p-5 sm:rounded-[2.5rem] sm:p-8 lg:col-span-7">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-cafe-fg">Busiest Hours</h3>

          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Orders by hour of day
          </p>
        </div>

        {peak && (
          <span className="shrink-0 rounded-full border border-cafe-accent/20 bg-cafe-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cafe-accent">
            Peak {hourLabel(peak.hour)}
          </span>
        )}
      </div>

      <div className="h-[220px]">
        {peak ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.gridColor}
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke={theme.axisColor}
                fontSize={10}
                axisLine={false}
                tickLine={false}
                interval={2}
              />

              <YAxis
                stroke={theme.axisColor}
                fontSize={10}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={28}
              />

              <Tooltip
                cursor={{ fill: theme.gridColor, opacity: 0.4 }}
                contentStyle={theme.tooltipContentStyle}
                labelStyle={{ color: theme.tooltipLabelColor }}
                itemStyle={{ color: CHART_ACCENT, fontWeight: "bold" }}
                formatter={(value) => [
                  formatCount(toChartNumber(value)),
                  "Orders",
                ]}
              />

              <Bar dataKey="orders" fill={CHART_ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label="No orders in this period" />
        )}
      </div>
    </div>
  );
});
