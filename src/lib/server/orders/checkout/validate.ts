import type { ProcessCheckoutInput } from "../types";

/** Returns the first validation error, or `null` when the input is valid. */
export function validateCheckoutInput(data: ProcessCheckoutInput): string | null {
  if (!data.customerName?.trim()) return "Customer name is required.";
  if (!data.phone?.trim()) return "Phone number is required.";

  if (data.orderType === "delivery" && !data.address?.trim()) {
    return "Delivery address is required.";
  }

  if (!data.cartItems || data.cartItems.length === 0) {
    return "Your cart is empty.";
  }

  return null;
}
