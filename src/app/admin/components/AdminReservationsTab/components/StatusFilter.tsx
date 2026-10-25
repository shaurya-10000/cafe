import { memo } from "react";

import { cx } from "../lib/cx";
import type { AdminBookingStatus } from "../types";

export type StatusFilterValue = "all" | AdminBookingStatus;

const OPTIONS: ReadonlyArray<{ value: StatusFilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface StatusFilterProps {
  value: StatusFilterValue;
  onChange: (value: StatusFilterValue) => void;
  counts: Record<StatusFilterValue, number>;
}

export const StatusFilter = memo(function StatusFilter({
  value,
  onChange,
  counts,
}: StatusFilterProps) {
  return (
    <div
      role="group"
      aria-label="Filter bookings by status"
      className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
    >
      {OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
              isActive
                ? "border-transparent bg-cafe-accent text-cafe-accent-fg shadow-lg shadow-cafe-accent/20"
                : "border-cafe-border text-gray-500 hover:text-cafe-fg",
            )}
          >
            {option.label}
            <span
              className={cx(
                "rounded-full px-1.5 py-0.5 text-[9px]",
                isActive ? "bg-cafe-accent-fg/15" : "bg-cafe-fg/5",
              )}
            >
              {counts[option.value]}
            </span>
          </button>
        );
      })}
    </div>
  );
});