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
    <div className="flex flex-col justify-between gap-4 rounded-[2rem] border border-cafe-border bg-cafe-card p-6">
      <div className="flex items-center justify-between">
        <div className={cx("rounded-lg border p-2", METRIC_COLOR_CLASSES[color])}>
          {icon}
        </div>

        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">
          {sub}
        </span>
      </div>

      <div>
        <h4 className="mb-1 text-[10px] font-black uppercase tracking-widest text-gray-500">
          {title}
        </h4>

        <p
          className="truncate text-2xl font-black tracking-tighter text-cafe-fg"
          title={String(value)}
        >
          {value}
        </p>
      </div>
    </div>
  );
});
