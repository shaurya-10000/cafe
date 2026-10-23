import type { CartItem } from "@/types/cart";

export function calculateSubtotal(items: readonly CartItem[]): number {
  return items.reduce(
    (total, item) => total + item.numeric_price * item.quantity,
    0,
  );
}
