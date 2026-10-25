import { memo } from "react";

import {
  Loader2,
  Pencil,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

import type { Coupon } from "@/app/admin/actions/couponActions";

import { cx } from "../lib/cx";
import { formatDiscountSummary, formatUsageSummary } from "../lib/format";
import type { CouponVariant } from "../types";
import { StatusBadge } from "./StatusBadge";

interface CouponRowProps {
  coupon: Coupon;
  variant: CouponVariant;
  isToggling: boolean;
  onToggle: (coupon: Coupon) => void;
  onEdit: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

const VARIANT_STYLES: Record<
  CouponVariant,
  {
    container: string;
    iconBox: string;
    icon: string;
    code: string;
    summary: string;
    toggleButton: string;
    toggleLabel: string;
  }
> = {
  active: {
    container:
      "border-zinc-100 bg-white dark:border-white/5 dark:bg-zinc-950",
    iconBox: "bg-[#C5A059]/10",
    icon: "text-[#C5A059]",
    code: "text-zinc-900 dark:text-zinc-100",
    summary: "text-zinc-500",
    toggleButton:
      "text-emerald-500 hover:bg-[#C5A059]/5 hover:text-[#C5A059] focus-visible:ring-[#C5A059]",
    toggleLabel: "Disable",
  },
  inactive: {
    container:
      "border-zinc-200/60 bg-zinc-50/50 opacity-60 transition-opacity hover:opacity-100 dark:border-white/5 dark:bg-zinc-950/40",
    iconBox: "bg-zinc-200/50 dark:bg-zinc-800",
    icon: "text-zinc-500",
    code: "text-zinc-500 line-through",
    summary: "text-zinc-500",
    toggleButton:
      "text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 focus-visible:ring-emerald-500 dark:hover:bg-emerald-950/20",
    toggleLabel: "Enable",
  },
};

export const CouponRow = memo(function CouponRow({
  coupon,
  variant,
  isToggling,
  onToggle,
  onEdit,
  onDelete,
}: CouponRowProps) {
  const styles = VARIANT_STYLES[variant];
  const ToggleIcon = variant === "active" ? ToggleRight : ToggleLeft;

  return (
    <div
      className={cx(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5",
        styles.container,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        <div
          aria-hidden="true"
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
            styles.iconBox,
          )}
        >
          <Tag size={16} className={styles.icon} />
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={cx(
                "break-all font-mono text-sm font-black tracking-tight",
                styles.code,
              )}
            >
              {coupon.code}
            </span>

            <StatusBadge coupon={coupon} />
          </div>

          <p className={cx("text-[11px] font-bold", styles.summary)}>
            {formatDiscountSummary(coupon)}
          </p>

          <p className="mt-0.5 text-[10px] font-bold text-zinc-400">
            {formatUsageSummary(coupon)}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 border-t border-zinc-100 pt-3 dark:border-white/5 sm:gap-2 sm:border-0 sm:pt-0">
        <button
          type="button"
          onClick={() => onToggle(coupon)}
          disabled={isToggling}
          aria-label={`${styles.toggleLabel} coupon ${coupon.code}`}
          aria-busy={isToggling}
          title={styles.toggleLabel}
          className={cx(
            "rounded-xl p-2.5 transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2",
            styles.toggleButton,
          )}
        >
          {isToggling ? (
            <Loader2 size={24} className="animate-spin" aria-hidden="true" />
          ) : (
            <ToggleIcon size={28} aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit(coupon)}
          aria-label={`Edit coupon ${coupon.code}`}
          title="Edit"
          className="rounded-xl p-3 text-zinc-400 transition-colors hover:bg-[#C5A059]/10 hover:text-[#C5A059] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
        >
          <Pencil size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onDelete(coupon)}
          aria-label={`Delete coupon ${coupon.code}`}
          title="Delete"
          className="rounded-xl p-3 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/20"
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});