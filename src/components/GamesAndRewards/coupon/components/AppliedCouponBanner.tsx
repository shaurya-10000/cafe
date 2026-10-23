import { CheckCircle2, X } from "lucide-react";
import type { AppliedCoupon } from "../types";

interface AppliedCouponBannerProps {
  readonly coupon: AppliedCoupon;
  readonly onRemove: () => void;
}

export function AppliedCouponBanner({
  coupon,
  onRemove,
}: AppliedCouponBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3">
      <div className="flex min-w-0 items-center gap-2">
        <CheckCircle2
          size={16}
          className="shrink-0 text-emerald-500"
          aria-hidden="true"
        />
        <span className="truncate text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {`${coupon.code} applied \u2014 \u2212$${coupon.discountAmount.toFixed(2)}`}
        </span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove coupon"
        className="shrink-0 p-1 text-emerald-600 transition-colors hover:text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:text-emerald-400"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
