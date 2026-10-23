import type { TimeRange } from "@/app/admin/components/AnalyticsTab";
import type {
  OrderItemLine,
  OrderRow as OrdersTabRow,
  OrderView,
} from "@/app/admin/components/OrdersTab";
import type { useSupabaseClient } from "@/utils/supabase/client";

export type { OrderItemLine, OrderView, TimeRange };

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

export type AdminTab =
  | "inventory"
  | "orders"
  | "analytics"
  | "reservations"
  | "branches"
  | "coupons";

export type OrderType = "delivery" | "pickup" | "scheduled";
export type PaymentMethod = "online" | "in_person";

export interface OrderRow extends OrdersTabRow {
  created_at: string;
  order_type: OrderType;
  payment_method: PaymentMethod;
  user_id: string | null;
}

export interface BookingRow {
  id: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  booking_date: string | null;
  booking_time: string | null;
  party_size: number | null;
  status: string | null;
  special_requests: string | null;
  business_locations: { name: string | null } | null;
}

export interface PieDatum {
  name: string;
  value: number;
  color: string;
}

export type SplitKey =
  | "deliveryOnline"
  | "deliveryInPerson"
  | "pickupOnline"
  | "pickupInPerson"
  | "scheduledOnline"
  | "scheduledInPerson";

export type OrderSplit = Record<SplitKey, number>;

/**
 * A type literal (not an interface) on purpose: only type literals are
 * implicitly assignable to the chart's index-signature point type.
 */
export type AnalyticsPoint = { created_at: string; total_amount: number };

export interface FilteredAnalytics {
  filtered: AnalyticsPoint[];
  revenue: number;
  count: number;
  topItem: string | null;
  leastItem: string | null;
  split: OrderSplit;
}
