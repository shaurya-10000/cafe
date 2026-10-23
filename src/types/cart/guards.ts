import type { CartItem } from "./types";

export const CART_ITEM_MAX_QUANTITY = 100;
export const CART_ITEM_MIN_QUANTITY = 1;

export function clampCartQuantity(value: number): number {
  if (!Number.isFinite(value)) return CART_ITEM_MIN_QUANTITY;
  return Math.min(CART_ITEM_MAX_QUANTITY, Math.max(CART_ITEM_MIN_QUANTITY, Math.floor(value)));
}

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Record<keyof CartItem, unknown>>;

  return (
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" && item.name.length > 0 &&
    typeof item.price === "string" &&
    typeof item.numeric_price === "number" && Number.isFinite(item.numeric_price) && item.numeric_price >= 0 &&
    typeof item.quantity === "number" && Number.isInteger(item.quantity) &&
    item.quantity >= CART_ITEM_MIN_QUANTITY && item.quantity <= CART_ITEM_MAX_QUANTITY
  );
}
