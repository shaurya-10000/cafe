import { AlertTriangle, Clock } from "lucide-react";

import { formatCouponDate } from "../lib/format";
import { DETAILS_CLASS } from "../styles";
import type { Coupon, CouponVariant } from "../types";

interface CouponDetailsProps {
  coupon: Coupon;
  variant: CouponVariant;
}

export function CouponDetails({ coupon, variant }: CouponDetailsProps) {
  const isActive = variant === "active";

  return (
    <div className={DETAILS_CLASS}>
      {coupon.min_order_amount > 0 && (
        <span>Min order ${coupon.min_order_amount}</span>
      )}

      {!!coupon.max_discount_amount && (
        <span>Max discount ${coupon.max_discount_amount}</span>
      )}

      {coupon.expires_at && (
        <span className="flex items-center gap-1">
          <Clock size={10} aria-hidden="true" />
          {isActive ? "Valid until" : "Expired"}{" "}
          {formatCouponDate(coupon.expires_at)}
        </span>
      )}

      {!!coupon.usage_limit && (
        <span className="flex items-center gap-1">
          <AlertTriangle size={10} aria-hidden="true" />
          {isActive
            ? `${coupon.usage_limit - coupon.used_count} uses left`
            : `${coupon.used_count} / ${coupon.usage_limit} used`}
        </span>
      )}
    </div>
  );
}