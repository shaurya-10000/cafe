import { memo } from "react";

import { TIME_RANGE_LABELS, TIME_RANGES } from "../constants";
import { cx } from "../lib/cx";
import type { TimeRange } from "../types";

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export const TimeRangeSelector = memo(function TimeRangeSelector({
  value,
  onChange,
}: TimeRangeSelectorProps) {
  return (
    <div
      role="group"
      aria-label="Time range"
      className="flex rounded-xl border border-cafe-border bg-cafe-fg/5 p-1"
    >
      {TIME_RANGES.map((range) => {
        const isActive = value === range;

        return (
          <button
            key={range}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(range)}
            className={cx(
              "rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
              isActive
                ? "bg-cafe-accent text-cafe-accent-fg shadow-lg shadow-cafe-accent/20"
                : "text-gray-500 hover:text-cafe-fg",
            )}
          >
            {TIME_RANGE_LABELS[range]}
          </button>
        );
      })}
    </div>
  );
});
