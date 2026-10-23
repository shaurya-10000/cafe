import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  CreditCard,
  PackageCheck,
  ShoppingBag,
  Star,
} from "lucide-react";

const TYPE_ICON: Record<string, ReactNode> = {
  review_prompt: <Star size={14} fill="currentColor" />,
  order_status: <PackageCheck size={14} />,
  order_placed: <ShoppingBag size={14} />,
  new_order: <ShoppingBag size={14} />,
  new_reservation: <CalendarCheck size={14} />,
  reservation_status: <CalendarCheck size={14} />,
  payment_status: <CreditCard size={14} />,
  reservation_reminder: <CalendarCheck size={14} />,
  payment_failed: <AlertTriangle size={14} />,
};

export const TYPE_LABEL: Record<string, string> = {
  review_prompt: "Review prompts",
  order_status: "Order updates",
  order_placed: "Order confirmations",
  new_order: "New orders (admin)",
  new_reservation: "New reservations (admin)",
  reservation_status: "Reservation updates",
  payment_status: "Payment updates",
  reservation_reminder: "Reservation reminders",
  payment_failed: "Payment issues",
};

export const ALL_TYPES: readonly string[] = Object.keys(TYPE_LABEL);

export const CLICKABLE_TYPES: ReadonlySet<string> = new Set([
  "review_prompt",
  "order_status",
  "new_order",
  "new_reservation",
  "reservation_status",
  "reservation_reminder",
  "payment_status",
  "payment_failed",
]);

export function getTypeIcon(type: string): ReactNode {
  return TYPE_ICON[type] ?? <Clock size={14} />;
}
