export type ActionOutcome =
  | { success: true }
  | { success: false; error: string };

export interface CheckoutCartItem {
  id: string;
  name?: string;
  quantity: number;
}

export interface ProcessCheckoutInput {
  cartItems: CheckoutCartItem[];
  orderType: "delivery" | "pickup";
  paymentMethod: "online" | "in_person";
  address?: string;
  phone: string;
  customerName: string;
  couponCode?: string;
}

/**
 * Three-arm union. The online arm has NO `success` discriminant, so callers
 * narrow it by elimination: after handling both `success` arms, the only
 * remaining shape is `{ url: string }`.
 */
export type ProcessCheckoutResult =
  | { url: string }
  | { success: true; orderId: string }
  | { success: false; error: string };

export type CancelPendingOrderResult =
  | { success: true; alreadyPaid?: boolean }
  | { success: false; error: string };
