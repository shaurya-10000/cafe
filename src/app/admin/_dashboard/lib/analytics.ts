import { PIE_SLICES, SPLIT_KEYS, TIME_RANGE_WINDOWS } from "../constants";
import type {
  AnalyticsPoint,
  FilteredAnalytics,
  OrderRow,
  OrderSplit,
  PieDatum,
  TimeRange,
} from "../types";

function createEmptySplit(): OrderSplit {
  return {
    deliveryOnline: 0,
    deliveryInPerson: 0,
    pickupOnline: 0,
    pickupInPerson: 0,
    scheduledOnline: 0,
    scheduledInPerson: 0,
  };
}

/**
 * Revenue, order count, best/worst seller and the delivery/payment split for
 * every order inside the selected window. Pure: pass `now` to test it.
 */
export function computeFilteredAnalytics(
  orders: readonly OrderRow[],
  timeRange: TimeRange,
  now: number = Date.now(),
): FilteredAnalytics {
  const window = TIME_RANGE_WINDOWS[timeRange];

  const filtered: AnalyticsPoint[] = [];
  const split = createEmptySplit();
  const itemCounts = new Map<string, number>();

  let revenue = 0;

  for (const order of orders) {
    const createdAtMs = new Date(order.created_at).getTime();

    if (!Number.isFinite(createdAtMs)) continue;
    if (window !== null && now - createdAtMs > window) continue;

    const amount: number = order.total_amount ?? order.total_price ?? 0;

    filtered.push({ created_at: order.created_at, total_amount: amount });
    revenue += amount;

    split[SPLIT_KEYS[order.order_type][order.payment_method]] += 1;

    for (const line of order.items ?? []) {
      const name = line.name?.trim() || line.product_name?.trim();
      const key = name || line.item_id;

      if (!key) continue;

      itemCounts.set(key, (itemCounts.get(key) ?? 0) + (line.quantity ?? 1));
    }
  }

  const sorted = Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1]);

  return {
    filtered,
    revenue,
    count: filtered.length,
    topItem: sorted[0]?.[0] ?? null,
    leastItem: sorted[sorted.length - 1]?.[0] ?? null,
    split,
  };
}

export function buildPieData(split: OrderSplit): PieDatum[] {
  return PIE_SLICES.map(({ key, name, color }) => ({
    name,
    value: split[key],
    color,
  }));
}
