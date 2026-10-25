import { memo, type ReactNode } from "react";

import { METRIC_COLOR_CLASSES } from "../constants";
import { cx } from "../lib/cx";
import type { MetricColor } from "../types";

interface MetricCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
  color: MetricColor;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  sub,
  icon,
  color,
}: MetricCardProps) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 rounded-3xl border border-cafe-border bg-cafe-card p-4 sm:gap-4 sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div
          className={cx(
            "shrink-0 rounded-lg border p-2",
            METRIC_COLOR_CLASSES[color],
          )}
        >
          {icon}
        </div>

        <span className="min-w-0 text-right text-[8px] font-black uppercase leading-tight tracking-widest text-gray-500">
          {sub}
        </span>
      </div>

      <div className="min-w-0">
        <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
          {title}
        </h4>

        <p
          className="line-clamp-2 break-words text-xl font-black leading-tight tracking-tighter text-cafe-fg sm:line-clamp-1 sm:text-2xl"
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
});
