import { memo } from "react";

import { formatCount } from "../lib/format";
import type { ItemRank } from "../types";
import { EmptyChartState } from "./EmptyChartState";

interface TopItemsCardProps {
  items: readonly ItemRank[];
}

export const TopItemsCard = memo(function TopItemsCard({
  items,
}: TopItemsCardProps) {
  const max = items.reduce((largest, item) => Math.max(largest, item.quantity), 0);

  return (
    <div className="min-w-0 rounded-3xl border border-cafe-border bg-cafe-card p-5 sm:rounded-[2.5rem] sm:p-8 lg:col-span-5">
      <h3 className="font-bold text-cafe-fg">Top Sellers</h3>

      <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-gray-500">
        Units sold in this period
      </p>

      {items.length === 0 ? (
        <div className="h-[200px]">
          <EmptyChartState label="No items sold in this period" />
        </div>
      ) : (
        <ol className="space-y-4">
          {items.map((item, index) => (
            <li key={item.name}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-bold">
                <span className="flex min-w-0 items-center gap-2 text-cafe-fg">
                  <span className="w-4 shrink-0 text-gray-500">{index + 1}</span>
                  <span className="truncate">{item.name}</span>
                </span>

                <span className="shrink-0 text-gray-500">
                  {formatCount(item.quantity)}
                </span>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-cafe-fg/5">
                <div
                  className="h-full rounded-full bg-cafe-accent"
                  style={{
                    width: `${max > 0 ? Math.max(4, (item.quantity / max) * 100) : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
});
