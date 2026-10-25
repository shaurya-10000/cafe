import { useEffect } from "react";

import { Loader2 } from "lucide-react";

import type {
  CouponFormData,
  DiscountType,
} from "@/app/admin/actions/couponActions";

import { CURRENCY_SYMBOL } from "../constants";
import { cx } from "../lib/cx";
import { MODAL_INPUT_CLASS, MODAL_LABEL_CLASS } from "../styles";
import { Field } from "./Field";

const DISCOUNT_TYPES: readonly { value: DiscountType; label: string }[] = [
  { value: "percentage", label: "% Percentage" },
  { value: "fixed", label: `${CURRENCY_SYMBOL} Fixed` },
];

interface CouponFormModalProps {
  isEditing: boolean;
  values: CouponFormData;
  error: string | null;
  submitting: boolean;
  onFieldChange: <K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K],
  ) => void;
  onCancel: () => void;
  onSubmit: () => void;
}

export function CouponFormModal({
  isEditing,
  values,
  error,
  submitting,
  onFieldChange,
  onCancel,
  onSubmit,
}: CouponFormModalProps) {
  // Escape closes the dialog (unless a save is in flight).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && !submitting) onCancel();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel, submitting]);

  const isPercentage = values.discount_type === "percentage";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? "Edit coupon" : "New coupon"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4"
    >
      <div className="max-h-[92vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-t-3xl border border-zinc-200 bg-white p-5 pb-8 shadow-2xl dark:border-white/5 dark:bg-zinc-950 sm:rounded-3xl sm:p-8">
        <h3 className="text-sm font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
          {isEditing ? "Edit Coupon" : "New Coupon"}
        </h3>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-500 dark:border-red-800 dark:bg-red-950/20"
          >
            {error}
          </p>
        )}

        <Field label="Code" labelClassName={MODAL_LABEL_CLASS}>
          <input
            className={cx(MODAL_INPUT_CLASS, "uppercase tracking-widest")}
            placeholder="SAVE20"
            autoCapitalize="characters"
            autoComplete="off"
            value={values.code}
            onChange={(event) =>
              onFieldChange("code", event.target.value.toUpperCase())
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          {DISCOUNT_TYPES.map(({ value, label }) => {
            const selected = values.discount_type === value;

            return (
              <button
                key={value}
                type="button"
                onClick={() => onFieldChange("discount_type", value)}
                aria-pressed={selected}
                className={cx(
                  "rounded-xl border p-3 text-[10px] font-black uppercase tracking-widest transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]",
                  selected
                    ? "border-[#C5A059] bg-[#C5A059]/10 text-zinc-900 dark:text-zinc-100"
                    : "border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-white/5 dark:bg-zinc-900",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <Field
          label={`Discount Value ${isPercentage ? "(%)" : `(${CURRENCY_SYMBOL})`}`}
          labelClassName={MODAL_LABEL_CLASS}
        >
          <input
            type="number"
            inputMode="decimal"
            min={0}
            max={isPercentage ? 100 : undefined}
            step={0.01}
            className={MODAL_INPUT_CLASS}
            value={values.discount_value}
            onChange={(event) =>
              onFieldChange("discount_value", parseFloat(event.target.value) || 0)
            }
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label={`Min Order (${CURRENCY_SYMBOL})`}
            labelClassName={MODAL_LABEL_CLASS}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              className={MODAL_INPUT_CLASS}
              value={values.min_order_amount}
              onChange={(event) =>
                onFieldChange(
                  "min_order_amount",
                  parseFloat(event.target.value) || 0,
                )
              }
            />
          </Field>

          <Field
            label={`Max Discount (${CURRENCY_SYMBOL})`}
            labelClassName={MODAL_LABEL_CLASS}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              placeholder="Unlimited"
              className={MODAL_INPUT_CLASS}
              value={values.max_discount_amount ?? ""}
              onChange={(event) =>
                onFieldChange(
                  "max_discount_amount",
                  event.target.value ? parseFloat(event.target.value) : null,
                )
              }
            />
          </Field>
        </div>

        <Field
          label="Usage Limit (blank = unlimited)"
          labelClassName={MODAL_LABEL_CLASS}
        >
          <input
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="Unlimited"
            className={MODAL_INPUT_CLASS}
            value={values.usage_limit ?? ""}
            onChange={(event) =>
              onFieldChange(
                "usage_limit",
                event.target.value ? parseInt(event.target.value, 10) : null,
              )
            }
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Starts At" labelClassName={MODAL_LABEL_CLASS}>
            <input
              type="datetime-local"
              className={MODAL_INPUT_CLASS}
              value={values.starts_at}
              onChange={(event) => onFieldChange("starts_at", event.target.value)}
            />
          </Field>

          <Field label="Expires At (optional)" labelClassName={MODAL_LABEL_CLASS}>
            <input
              type="datetime-local"
              className={MODAL_INPUT_CLASS}
              value={values.expires_at ?? ""}
              onChange={(event) =>
                onFieldChange("expires_at", event.target.value || null)
              }
            />
          </Field>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-white/5 dark:bg-zinc-900">
          <span className={MODAL_LABEL_CLASS}>Active</span>

          <button
            type="button"
            onClick={() => onFieldChange("is_active", !values.is_active)}
            aria-pressed={values.is_active}
            aria-label="Coupon active"
            className={cx(
              "relative h-7 w-12 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]",
              values.is_active ? "bg-[#C5A059]" : "bg-zinc-300 dark:bg-zinc-700",
            )}
          >
            <span
              aria-hidden="true"
              className={cx(
                "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
                values.is_active && "translate-x-5",
              )}
            />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-zinc-200 p-3.5 text-[10px] font-black uppercase tracking-widest transition-colors hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] dark:border-white/10 dark:hover:bg-white/5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            aria-busy={submitting}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#C5A059] p-3.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#A67C00] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] focus-visible:ring-offset-2"
          >
            {submitting && (
              <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            )}
            {isEditing ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}