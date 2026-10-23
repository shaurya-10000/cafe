import {
  ACTIVE_STATUSES,
  PAST_STATUSES,
  STATUS_STEPS,
} from "../constants";
import type { OrderRow, OrderView } from "../types";

export function filterActiveOrders(orders: readonly OrderRow[]): OrderRow[] {
  return orders.filter(
    (order) =>
      ACTIVE_STATUSES.has(order.status) && order.order_type !== "scheduled",
  );
}

export function filterAdvancedOrders(orders: readonly OrderRow[]): OrderRow[] {
  return orders.filter(
    (order) =>
      order.order_type === "scheduled" &&
      order.status !== "completed" &&
      order.status !== "declined",
  );
}

export function filterPastOrders(orders: readonly OrderRow[]): OrderRow[] {
  return orders.filter((order) => PAST_STATUSES.has(order.status));
}

export function selectOrdersForView(
  view: OrderView,
  lists: { active: OrderRow[]; advanced: OrderRow[]; past: OrderRow[] },
): OrderRow[] {
  switch (view) {
    case "active":
      return lists.active;
    case "advanced":
      return lists.advanced;
    case "past":
      return lists.past;
    default: {
      // Exhaustiveness: a new OrderView member should fail compilation.
      const exhaustive: never = view;
      void exhaustive;
      return lists.active;
    }
  }
}

/** Index of `status` in the fulfilment steps, or -1 for off-track statuses. */
export function getStatusStepIndex(status: string): number {
  return STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);
}

export function getProgressWidth(status: string): string {
  const index = getStatusStepIndex(status);

  if (index === -1) return "0%";

  return `${(index / (STATUS_STEPS.length - 1)) * 100}%`;
}
