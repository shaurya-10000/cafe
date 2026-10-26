import { Tag } from "lucide-react";

import { deriveCouponStatus } from "@/lib/coupons/calculate";

import { STATUS_LABEL, USED_LABEL } from "../constants";
import { formatDiscountLabel } from "../lib/discount";
import {
  ARCHIVED_BADGE_CLASS,
  ARCHIVED_CARD_CLASS,
  ARCHIVED_CODE_CLASS,
  ARCHIVED_DISCOUNT_CLASS,
  ARCHIVED_ICON_CLASS,
  CARD_HEADER_CLASS,
} from "../styles";
import type { Coupon } from "../types";
import { CouponDetails } from "./CouponDetails";

export function ArchivedCouponCard({ coupon }: { coupon: Coupon }) {
  const status = deriveCouponStatus(coupon);

  // An archived coupon that is still "active" in general can only be here
  // because this customer can no longer redeem it.
  const label = status === "active" ? USED_LABEL : STATUS_LABEL[status];

  return (
    <div className={ARCHIVED_CARD_CLASS}>
      <div className={CARD_HEADER_CLASS}>
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className={ARCHIVED_ICON_CLASS}>
            <Tag size={18} className="text-gray-500" />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={ARCHIVED_CODE_CLASS}>{coupon.code}</span>
              <span className={ARCHIVED_BADGE_CLASS}>{label}</span>
            </div>
            <p className={ARCHIVED_DISCOUNT_CLASS}>
              {formatDiscountLabel(coupon)}
            </p>
          </div>
        </div>
      </div>

      <CouponDetails coupon={coupon} variant="archived" />
    </div>
  );
}