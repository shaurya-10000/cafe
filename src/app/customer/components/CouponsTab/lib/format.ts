import { DATE_LOCALE } from "../constants";

export function formatCouponDate(iso: string): string {
  return new Date(iso).toLocaleDateString(DATE_LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}