import { PIE_SLICES, SPLIT_KEYS, TIME_RANGE_WINDOWS } from "../constants";
import type {
  AnalyticsPoint,
  FilteredAnalytics,
  OrderRow,
  OrderSplit,
  PieDatum,
  TimeRange,
} from "../types";

const TOP_ITEMS_LIMIT = 5;

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
 * Revenue, order count, best/worst seller, the delivery/payment split, the
 * previous window's totals, top items and orders per hour for every order
 * inside the selected window. Pure: pass `now` to test it.
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
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, orders: 0 }));

  let revenue = 0;
  let previousRevenue = 0;
  let previousCount = 0;

  for (const order of orders) {
    const createdAtMs = new Date(order.created_at).getTime();

    if (!Number.isFinite(createdAtMs)) continue;

    const amount: number = order.total_amount ?? order.total_price ?? 0;
    const age = now - createdAtMs;

    if (window !== null && age > window) {
      if (age <= window * 2) {
        previousRevenue += amount;
        previousCount += 1;
      }
      continue;
    }

    filtered.push({ created_at: order.created_at, total_amount: amount });
    revenue += amount;

    split[SPLIT_KEYS[order.order_type][order.payment_method]] += 1;

    const bucket = hourly[new Date(createdAtMs).getHours()];
    if (bucket) bucket.orders += 1;

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
    previous:
      window === null
        ? null
        : { revenue: previousRevenue, count: previousCount },
    topItems: sorted
      .slice(0, TOP_ITEMS_LIMIT)
      .map(([name, quantity]) => ({ name, quantity })),
    hourly,
  };
}

export function buildPieData(split: OrderSplit): PieDatum[] {
  return PIE_SLICES.map(({ key, name, color }) => ({
    name,
    value: split[key],
    color,
  }));
}
