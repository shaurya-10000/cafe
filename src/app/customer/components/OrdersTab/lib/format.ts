import { MONEY_LOCALE } from "../constants";

export function formatMoney(
  value: number | string | null | undefined,
  currency: string,
): string {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : 0;
  const safe = Number.isFinite(numeric) ? numeric : 0;

  try {
    return new Intl.NumberFormat(MONEY_LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // business_settings.currency is only constrained to 3 chars at the DB
    // layer, not validated against ISO 4217; degrade instead of crashing.
    return `${currency} ${safe.toFixed(2)}`;
  }
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString(MONEY_LOCALE, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}