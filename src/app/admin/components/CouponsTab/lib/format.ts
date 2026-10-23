import type { Coupon } from "@/app/admin/actions/couponActions";

import { CURRENCY_SYMBOL } from "../constants";

const SEPARATOR = " \u00b7 ";

/** "20% off \u00b7 Min $10 \u00b7 Max $5" */
export function formatDiscountSummary(coupon: Coupon): string {
  const parts = [
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% off`
      : `${CURRENCY_SYMBOL}${coupon.discount_value} off`,
  ];

  if (coupon.min_order_amount > 0) {
    parts.push(`Min ${CURRENCY_SYMBOL}${coupon.min_order_amount}`);
  }

  if (coupon.max_discount_amount) {
    parts.push(`Max ${CURRENCY_SYMBOL}${coupon.max_discount_amount}`);
  }

  return parts.join(SEPARATOR);
}

/** "3 used / 10 limit \u00b7 Expires 1/2/2026" */
export function formatUsageSummary(coupon: Coupon): string {
  const used = `${coupon.used_count} used${
    coupon.usage_limit ? ` / ${coupon.usage_limit} limit` : " (unlimited)"
  }`;

  if (!coupon.expires_at) return used;

  return `${used}${SEPARATOR}Expires ${new Date(
    coupon.expires_at,
  ).toLocaleDateString()}`;
}
