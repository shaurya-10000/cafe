import type { CartItem } from "@/types/cart";

export type OrderType = "delivery" | "pickup";
export type PaymentMethod = "online" | "in_person";
export type View = "cart" | "options";

export interface FavoriteCatalogItem {
  id: string;
  name: string;
  numeric_price: number;
}

export interface FavoriteDisplayItem extends FavoriteCatalogItem {
  priceLabel: string;
}

export interface OrderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemoveOne: (id: string) => Promise<void>;
  onRemoveAll: (id: string) => Promise<void>;
  onClear: () => void;
  favoriteIds?: string[];
  onAddItem?: (
    item: Omit<CartItem, "quantity">,
    quantity?: number,
  ) => Promise<void>;
}

export interface CheckoutFormValues {
  customerName: string;
  phone: string;
  address: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
}

export type SetCheckoutField = <K extends keyof CheckoutFormValues>(
  key: K,
  value: CheckoutFormValues[K],
) => void;

/** Payload of the `cafe_prefill_checkout` window event. */
export interface CheckoutPrefillDetail {
  name?: string;
  phone?: string;
  address?: string;
  orderType?: OrderType;
  paymentMethod?: PaymentMethod;
}
