import type { NotificationRow } from "../types";

export type NotificationAction =
  | { readonly type: "navigate"; readonly href: string }
  /** Nothing to open, but the sidebar should still close. */
  | { readonly type: "close" }
  | { readonly type: "ignore" };

export function buildRateOrderHref(orderId: string): string {
  return `/customer?tab=history&rateOrder=${orderId}`;
}

export function resolveNotificationAction(
  notification: Pick<NotificationRow, "type" | "order_id">,
  isAdmin: boolean,
): NotificationAction {
  switch (notification.type) {
    case "review_prompt":
      return notification.order_id
        ? { type: "navigate", href: buildRateOrderHref(notification.order_id) }
        : { type: "close" };
    case "order_status":
    case "payment_status":
      return {
        type: "navigate",
        href: isAdmin ? "/admin?tab=orders" : "/customer?tab=active",
      };
    case "new_order":
      return { type: "navigate", href: "/admin?tab=orders" };
    case "new_reservation":
      return { type: "navigate", href: "/admin?tab=reservations" };
    case "reservation_status":
    case "reservation_reminder":
      return { type: "navigate", href: "/customer?tab=bookings" };
    case "payment_failed":
      return { type: "navigate", href: "/customer?tab=active" };
    default:
      return { type: "ignore" };
  }
}
