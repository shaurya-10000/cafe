import { memo } from "react";

import { Banknote, CreditCard, type LucideIcon } from "lucide-react";

import { cx } from "../lib/cx";
import { FIELD_LABEL, FOCUS_RING } from "../styles";
import type { PaymentMethod } from "../types";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  Icon: LucideIcon;
}

const OPTIONS: readonly PaymentOption[] = [
  { value: "online", label: "Digital Payment (Stripe)", Icon: CreditCard },
  { value: "in_person", label: "Cash on Delivery", Icon: Banknote },
];

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
}

export const PaymentMethodSelector = memo(function PaymentMethodSelector({
  value,
  onChange,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4 pb-4">
      <p className={FIELD_LABEL}>Transaction Protocol</p>

      <div className="space-y-2">
        {OPTIONS.map(({ value: optionValue, label, Icon }) => {
          const selected = value === optionValue;

          return (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(optionValue)}
              aria-pressed={selected}
              className={cx(
                "flex w-full items-center justify-between rounded-2xl border p-4 transition-all",
                FOCUS_RING,
                selected
                  ? "border-[#C5A059] bg-[#C5A059]/5"
                  : "border-[#EAE9E4] bg-white dark:border-white/5 dark:bg-zinc-900/40",
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  size={18}
                  aria-hidden="true"
                  className={selected ? "text-[#C5A059]" : "text-zinc-400"}
                />

                <span
                  className={cx(
                    "text-[10px] font-black uppercase tracking-widest",
                    selected
                      ? "text-zinc-900 dark:text-zinc-100"
                      : "text-zinc-500",
                  )}
                >
                  {label}
                </span>
              </div>

              <div
                aria-hidden="true"
                className={cx(
                  "h-4 w-4 rounded-full border-2",
                  selected
                    ? "border-[#C5A059] bg-[#C5A059]"
                    : "border-[#EAE9E4] dark:border-white/10",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});
