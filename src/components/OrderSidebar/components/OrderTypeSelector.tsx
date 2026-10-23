import { memo } from "react";

import { MapPin, Store, type LucideIcon } from "lucide-react";

import { cx } from "../lib/cx";
import { FOCUS_RING } from "../styles";
import type { OrderType } from "../types";

interface OrderTypeOption {
  value: OrderType;
  label: string;
  Icon: LucideIcon;
}

const OPTIONS: readonly OrderTypeOption[] = [
  { value: "delivery", label: "Delivery", Icon: MapPin },
  { value: "pickup", label: "Takeaway", Icon: Store },
];

interface OrderTypeSelectorProps {
  value: OrderType;
  onChange: (value: OrderType) => void;
}

export const OrderTypeSelector = memo(function OrderTypeSelector({
  value,
  onChange,
}: OrderTypeSelectorProps) {
  return (
    <div className="grid shrink-0 grid-cols-2 gap-3">
      {OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const selected = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            aria-pressed={selected}
            className={cx(
              "flex flex-col gap-3 rounded-3xl border p-5 text-left transition-all",
              FOCUS_RING,
              selected
                ? "border-zinc-950 bg-zinc-950 text-white dark:bg-white dark:text-black"
                : "border-[#EAE9E4] bg-white dark:border-white/5 dark:bg-zinc-900/40",
            )}
          >
            <Icon
              size={22}
              aria-hidden="true"
              className={selected ? "text-[#C5A059]" : "text-zinc-400"}
            />

            <span className="text-[11px] font-black uppercase tracking-widest">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
