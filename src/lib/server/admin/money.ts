/** Stripe amounts are integers in minor units (cents, paise, ...). */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100);
}
