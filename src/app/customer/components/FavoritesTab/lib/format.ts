import { PRICE_LOCALE } from "../constants";

export function formatPrice(value: number, currency: string): string {
  const safe = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat(PRICE_LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(safe);
  } catch {
    // business_settings.currency is only constrained to 3 chars at the DB
    // layer, not validated against ISO 4217: a garbage value shouldn't crash
    // the grid, just degrade.
    return `${currency} ${safe.toFixed(2)}`;
  }
}