export interface CartItem {
  id: string;
  name: string;
  price: string;
  numeric_price: number;
  quantity: number;
}

export const CART_ITEM_MAX_QUANTITY = 100 as const;
export const CART_ITEM_MIN_QUANTITY = 1 as const;

export function clampCartQuantity(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return CART_ITEM_MIN_QUANTITY;
  const floored = Math.floor(n);
  if (floored < CART_ITEM_MIN_QUANTITY) return CART_ITEM_MIN_QUANTITY;
  if (floored > CART_ITEM_MAX_QUANTITY) return CART_ITEM_MAX_QUANTITY;
  return floored;
}

export function isValidCartQuantity(value: unknown): value is number {
  if (typeof value !== "number") return false;
  if (!Number.isFinite(value)) return false;
  if (!Number.isInteger(value)) return false;
  return value >= CART_ITEM_MIN_QUANTITY && value <= CART_ITEM_MAX_QUANTITY;
}
