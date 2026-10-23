import { logFetchError } from "../lib/log";
import { normalizeOrder } from "../lib/normalize";
import type { OrderRow, SupabaseClientLike } from "../types";

const ORDER_COLUMNS =
  "id, created_at, status, total_amount, total_price, is_paid, order_type, payment_method, customer_name, user_id, items";

/** Newest first. Returns `null` on failure so callers keep their current data. */
export async function fetchOrders(
  supabase: SupabaseClientLike,
): Promise<OrderRow[] | null> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    logFetchError("orders", error);
    return null;
  }

  return (data ?? [])
    .map(normalizeOrder)
    .filter((order): order is OrderRow => order !== null);
}
