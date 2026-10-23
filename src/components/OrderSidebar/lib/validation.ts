import type { CheckoutFormValues } from "../types";

/** Returns the first validation error message, or `null` when valid. */
export function validateCheckoutForm(
  values: CheckoutFormValues,
): string | null {
  if (!values.customerName.trim()) return "Please enter your name.";
  if (!values.phone.trim()) return "Please enter a phone number.";

  if (values.orderType === "delivery" && !values.address.trim()) {
    return "Please enter a delivery address.";
  }

  return null;
}
