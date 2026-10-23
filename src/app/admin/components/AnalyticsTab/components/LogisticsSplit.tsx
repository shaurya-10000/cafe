import { memo } from "react";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatCount, toChartNumber } from "../lib/format";
import { toPercent } from "../lib/pie";
import type { ChartTheme, PieDatum } from "../types";
import { EmptyChartState } from "./EmptyChartState";

interface LogisticsSplitProps {
  entries: PieDatum[];
  total: number;
  theme: ChartTheme;
}

export const LogisticsSplit = memo(function LogisticsSplit({
  entries,
  total,
  theme,
}: LogisticsSplitProps) {
  const hasData = total > 0;

  return (
    <div className="flex flex-col justify-between rounded-[2.5rem] border border-cafe-border bg-cafe-card p-8 lg:col-span-4">
      <div>
        <h3 className="font-bold text-cafe-fg">Logistics Split</h3>

        <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Order type &times; payment method
        </p>
      </div>

      <div className="h-[200px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={entries}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={8}
                dataKey="value"
              >
                {entries.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={theme.tooltipContentStyle}
                labelStyle={{ color: theme.tooltipLabelColor }}
                formatter={(value, name) => [
                  formatCount(toChartNumber(value)),
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChartState label="No data for this period" />
        )}
      </div>

      {hasData && (
        <div className="mt-6 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.name}
              className="flex items-center justify-between text-[10px] font-bold uppercase"
            >
              <span className="truncate pr-2 text-gray-500">{entry.name}</span>

              <span className="shrink-0 text-cafe-fg">
                {formatCount(entry.value)}
                <span className="ml-1 font-medium normal-case text-gray-400">
                  ({toPercent(entry.value, total)}%)
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
