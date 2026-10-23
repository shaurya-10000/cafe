import { memo } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import type { Coupon, CouponStatus } from "@/app/admin/actions/couponActions";
import { deriveCouponStatus } from "@/lib/coupons/calculate";

import { cx } from "../lib/cx";

const STATUS_CONFIG: Record<
  CouponStatus,
  { label: string; color: string; Icon: LucideIcon }
> = {
  active: {
    label: "Active",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    Icon: CheckCircle2,
  },
  scheduled: {
    label: "Scheduled",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    Icon: Clock,
  },
  expired: {
    label: "Expired",
    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    Icon: XCircle,
  },
  disabled: {
    label: "Disabled",
    color: "text-zinc-600 bg-zinc-600/10 border-zinc-600/20",
    Icon: XCircle,
  },
  used_up: {
    label: "Used Up",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    Icon: AlertTriangle,
  },
};

interface StatusBadgeProps {
  coupon: Coupon;
}

export const StatusBadge = memo(function StatusBadge({ coupon }: StatusBadgeProps) {
  const { label, color, Icon } = STATUS_CONFIG[deriveCouponStatus(coupon)];

  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest",
        color,
      )}
    >
      <Icon size={10} aria-hidden="true" />
      {label}
    </span>
  );
});
