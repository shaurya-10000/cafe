import { Tag } from "lucide-react";

import { STATUS_LABEL } from "../constants";
import { formatDiscountLabel } from "../lib/discount";
import {
  ACTIVE_BADGE_CLASS,
  ACTIVE_CARD_CLASS,
  ACTIVE_CODE_CLASS,
  ACTIVE_DISCOUNT_CLASS,
  ACTIVE_ICON_CLASS,
  CARD_HEADER_CLASS,
} from "../styles";
import type { Coupon } from "../types";
import { CopyButton } from "./CopyButton";
import { CouponDetails } from "./CouponDetails";

interface ActiveCouponCardProps {
  coupon: Coupon;
  justCopied: boolean;
  onCopy: (coupon: Coupon) => void;
}

export function ActiveCouponCard({
  coupon,
  justCopied,
  onCopy,
}: ActiveCouponCardProps) {
  return (
    <div className={ACTIVE_CARD_CLASS}>
      <div className={CARD_HEADER_CLASS}>
        <div className="flex items-center gap-4">
          <div aria-hidden="true" className={ACTIVE_ICON_CLASS}>
            <Tag size={18} className="text-[#C5A059]" />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className={ACTIVE_CODE_CLASS}>{coupon.code}</span>
              <span className={ACTIVE_BADGE_CLASS}>{STATUS_LABEL.active}</span>
            </div>
            <p className={ACTIVE_DISCOUNT_CLASS}>
              {formatDiscountLabel(coupon)}
            </p>
          </div>
        </div>

        <CopyButton
          code={coupon.code}
          justCopied={justCopied}
          onCopy={() => onCopy(coupon)}
        />
      </div>

      <CouponDetails coupon={coupon} variant="active" />
    </div>
  );
}