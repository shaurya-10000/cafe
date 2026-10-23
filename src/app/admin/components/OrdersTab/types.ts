import type { useSupabaseClient } from "@/utils/supabase/client";

export type SupabaseClientLike = ReturnType<typeof useSupabaseClient>;

export type OrderView = "active" | "advanced" | "past";

/**
 * Order items are a jsonb array. Per `validate_order_integrity` in the
 * database, the only guaranteed keys on each element are `item_id` and
 * `quantity`; `name`, `unit_price`, and `line_total` are written by the
 * current server code but are not required by the UI. `product_name` is
 * only ever present on legacy rows and is kept here for a safe fallback.
 *
 * All numeric fields are `number` (not `number | string`): the page's
 * normalizer coerces NUMERIC columns to JS numbers before handing rows to
 * this component.
 */
export interface OrderItemLine {
  item_id?: string | null;
  quantity?: number | null;
  name?: string | null;
  product_name?: string | null;
  unit_price?: number | null;
  line_total?: number | null;
}

/**
 * The shape `OrdersTab` needs from an order.
 *
 * `total_amount` is `number | null`: the page's normalizer coerces the
 * underlying NUMERIC column to a JS number before this interface is
 * satisfied. Coercion is the data layer's job, not this renderer's.
 *
 * `total_price` is a legacy column retained on old installations. It is
 * optional and never read here, but keeping it lets a wider parent row type
 * stay structurally assignable without a cast.
 */
export interface OrderRow {
  id: string;
  status: string;
  order_type?: string | null;
  payment_method: string;
  is_paid: boolean;
  total_amount: number | null;
  total_price?: number | null;
  customer_name?: string | null;
  items?: OrderItemLine[] | null;
}

export interface OrdersTabProps {
  orderView: OrderView;
  setOrderView: (view: OrderView) => void;
  orders: OrderRow[];
  openStatusMenu: string | null;
  setOpenStatusMenu: (id: string | null) => void;
  handleStatusUpdate: (
    id: string,
    status: string,
  ) => Promise<unknown> | unknown;
  handlePaymentToggle: (
    id: string,
    isPaid: boolean,
  ) => Promise<unknown> | unknown;
  /**
   * ISO 4217 code from business_settings.currency, threaded down from the
   * admin page. Defaulted to "USD" only so the component is usable in
   * isolation (tests, storybook).
   */
  currency?: string;
}

export type MoneyFormatter = (
  value: number | string | null | undefined,
) => string;
