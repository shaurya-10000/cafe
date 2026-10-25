import { memo, type ReactNode } from "react";

import { METRIC_COLOR_CLASSES } from "../constants";
import { cx } from "../lib/cx";
import { formatDelta } from "../lib/delta";
import type { MetricColor } from "../types";

interface MetricCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
  color: MetricColor;
  /** Percent change vs the previous period. undefined hides it, null means no baseline. */
  delta?: number | null;
  className?: string;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  sub,
  icon,
  color,
  delta,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col justify-between gap-3 rounded-3xl border border-cafe-border bg-cafe-card p-4 sm:gap-4 sm:rounded-[2rem] sm:p-6",
        className,
      )}
    >
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

        {delta !== undefined ? (
          <p
            className={cx(
              "mt-1.5 text-[10px] font-bold",
              delta === null
                ? "text-gray-500"
                : delta >= 0
                  ? "text-emerald-500"
                  : "text-red-500",
            )}
          >
            {delta === null
              ? "No prior period"
              : `${formatDelta(delta)} vs previous`}
          </p>
        ) : (
          <p aria-hidden="true" className="mt-1.5 select-none text-[10px] font-bold">
            {"\u00a0"}
          </p>
        )}
      </div>
    </div>
  );
});
