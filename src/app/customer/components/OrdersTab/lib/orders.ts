import { PAST_STATUSES, SCHEDULED_ORDER_TYPE } from "../constants";
import type { OrderBuckets, OrderRow } from "../types";

export function isPastStatus(status: string): boolean {
  return PAST_STATUSES.has(status);
}

/**
 * Single-pass split into the three views:
 *   past     = completed / declined / refunded
 *   advanced = scheduled and not past
 *   active   = everything else
 */
export function partitionOrders(orders: readonly OrderRow[]): OrderBuckets {
  const buckets: OrderBuckets = { active: [], advanced: [], past: [] };

  for (const order of orders) {
    if (isPastStatus(order.status)) {
      buckets.past.push(order);
    } else if (order.order_type === SCHEDULED_ORDER_TYPE) {
      buckets.advanced.push(order);
    } else {
      buckets.active.push(order);
    }
  }

  return buckets;
}

export function collectItemIds(orders: readonly OrderRow[]): string[] {
  const ids = new Set<string>();

  for (const order of orders) {
    for (const line of order.items ?? []) {
      if (line?.item_id) ids.add(line.item_id);
    }
  }

  return Array.from(ids);
}