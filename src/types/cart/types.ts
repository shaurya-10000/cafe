export interface CartItem {
  id: string;
  name: string;
  price: string;
  numeric_price: number;
  quantity: number;
}

export interface CartLineItem { itemId?: string; itemName?: string; itemPrice?: number; quantity?: number; }
export interface CartData {
  items?: CartLineItem[];
  itemId?: string; itemName?: string; itemPrice?: number; quantity?: number;
}
export interface CartMutationData { itemId?: string; itemName?: string; quantity?: number; }

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "online" | "in_person";
export interface CheckoutData {
  orderType?: OrderType; paymentMethod?: PaymentMethod;
  name?: string; phone?: string; address?: string;
}
export interface CouponApplyData { code?: string; }

export type CartAction =
  | { type: "ADD_TO_CART"; label: string; data?: CartData }
  | { type: "REMOVE_FROM_CART"; label: string; data?: CartMutationData }
  | { type: "UPDATE_CART_ITEM"; label: string; data?: CartMutationData }
  | { type: "CLEAR_CART"; label: string; data?: Record<string, never> }
  | { type: "START_CHECKOUT"; label: string; data?: CheckoutData }
  | { type: "APPLY_COUPON"; label: string; data?: CouponApplyData };
