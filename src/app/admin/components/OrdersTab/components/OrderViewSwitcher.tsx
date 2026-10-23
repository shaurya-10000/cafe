import { memo } from "react";

import { cx } from "../lib/cx";
import type { OrderView } from "../types";

interface ViewOption {
  value: OrderView;
  focusRing: string;
  activeStyle: string;
}

const VIEW_OPTIONS: readonly ViewOption[] = [
  {
    value: "active",
    focusRing: "focus-visible:ring-blue-500",
    activeStyle: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
  },
  {
    value: "advanced",
    focusRing: "focus-visible:ring-orange-500",
    activeStyle: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
  },
  {
    value: "past",
    focusRing: "focus-visible:ring-cafe-fg",
    activeStyle: "bg-cafe-fg/10 text-cafe-fg",
  },
];

interface OrderViewSwitcherProps {
  view: OrderView;
  activeCount: number;
  advancedCount: number;
  onChange: (view: OrderView) => void;
}

export const OrderViewSwitcher = memo(function OrderViewSwitcher({
  view,
  activeCount,
  advancedCount,
  onChange,
}: OrderViewSwitcherProps) {
  const labels: Record<OrderView, string> = {
    active: `Active (${activeCount})`,
    advanced: `Advanced (${advancedCount})`,
    past: "Past",
  };

  return (
    <div
      role="group"
      aria-label="Order view"
      className="flex max-w-full flex-wrap gap-2 overflow-x-auto rounded-2xl border border-cafe-border bg-cafe-fg/5 p-1 text-[9px] font-bold uppercase tracking-widest"
    >
      {VIEW_OPTIONS.map(({ value, focusRing, activeStyle }) => {
        const selected = view === value;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(value)}
            className={cx(
              "whitespace-nowrap rounded-xl px-5 py-2.5 transition-all focus:outline-none focus-visible:ring-2",
              focusRing,
              selected ? activeStyle : "text-gray-500 hover:text-cafe-fg",
            )}
          >
            {labels[value]}
          </button>
        );
      })}
    </div>
  );
});
