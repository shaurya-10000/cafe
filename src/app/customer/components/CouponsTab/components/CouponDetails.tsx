import { AlertTriangle, Clock } from "lucide-react";

import { daysUntil, formatCouponDate } from "../lib/format";
import { DETAILS_CLASS } from "../styles";
import type { Coupon, CouponVariant } from "../types";

const EXPIRING_SOON_DAYS = 3;

interface CouponDetailsProps {
  coupon: Coupon;
  variant: CouponVariant;
}

export function CouponDetails({ coupon, variant }: CouponDetailsProps) {
  const isActive = variant === "active";

  const daysLeft =
    isActive && coupon.expires_at ? daysUntil(coupon.expires_at) : null;
  const expiringSoon =
    daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRING_SOON_DAYS;

  const expiryLabel = !coupon.expires_at
    ? null
    : !isActive
      ? `Expired ${formatCouponDate(coupon.expires_at)}`
      : expiringSoon
        ? `Expires in ${daysLeft ?? 0} ${daysLeft === 1 ? "day" : "days"}`
        : `Valid until ${formatCouponDate(coupon.expires_at)}`;

  return (
    <div className={DETAILS_CLASS}>
      {coupon.min_order_amount > 0 && (
        <span>Min order ${coupon.min_order_amount}</span>
      )}

      {!!coupon.max_discount_amount && (
        <span>Max discount ${coupon.max_discount_amount}</span>
      )}

      {expiryLabel && (
        <span
          className={`flex items-center gap-1 ${
            expiringSoon ? "font-black text-amber-500" : ""
          }`}
        >
          <Clock size={11} aria-hidden="true" />
          {expiryLabel}
        </span>
      )}

      {!!coupon.usage_limit && (
        <span className="flex items-center gap-1">
          <AlertTriangle size={11} aria-hidden="true" />
          {isActive
            ? `${Math.max(0, coupon.usage_limit - coupon.used_count)} uses left`
            : `${coupon.used_count} / ${coupon.usage_limit} used`}
        </span>
      )}
    </div>
  );
}