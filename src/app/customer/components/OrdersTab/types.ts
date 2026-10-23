import type { LucideIcon } from "lucide-react";

export type OrderView = "active" | "advanced" | "past";

/**
 * Minimum shape read from an order row. `orders.items` is a jsonb array whose
 * only guaranteed keys are `item_id` and `quantity` (see
 * `validate_order_integrity` in supabase.sql).
 */
export interface OrderItemLine {
  item_id?: string;
  quantity?: number;
  /** Not written by the DB. Legacy rows only; fallback if the catalog lookup misses. */
  name?: string;
}

/** Exported so the dashboard can type its `orders` state without `any` casts. */
export interface OrderRow {
  id: string;
  status: string;
  order_type?: string | null;
  total_amount: number | string | null;
  created_at: string;
  items?: OrderItemLine[] | null;
}

export interface OrdersTabProps {
  orders: OrderRow[];
  view: OrderView;
  setView: (view: OrderView) => void;
  /**
   * ISO 4217 code from business_settings.currency, threaded down from the
   * dashboard. Defaults to "USD" only as a last resort.
   */
  currency?: string;
  /**
   * One-shot signal from the URL (?rateOrder=<id>), set by ChatWidget's
   * RATE_ORDER action and NotificationsSidebar's review_prompt click. Opens
   * the RateOrderModal for that order. The parent owns the URL param; this
   * component owns the modal. Closing calls `onExternalRatingClosed` so the
   * parent can clear the param.
   */
  externalRatingOrderId?: string;
  onExternalRatingClosed?: () => void;
}

export type OrderBuckets = Record<OrderView, OrderRow[]>;

export type ItemNameResolver = (line: OrderItemLine) => string;

export interface CatalogNameRow {
  id: string;
  name: string;
}

export interface ItemNameLookup {
  names: ReadonlyMap<string, string>;
  /** Ids already looked up, whether or not a name came back. */
  resolved: ReadonlySet<string>;
}

export interface ViewOption {
  id: OrderView;
  label: string;
  /** Noun used in the empty state: "No {emptyLabel} orders found". */
  emptyLabel: string;
  focusRingClass: string;
  activeClass: string;
}

export interface StatusStyle {
  Icon: LucideIcon;
  wrapperClass: string;
}