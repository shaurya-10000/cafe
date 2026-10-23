import { Calendar, Heart, Tag, Timer } from "lucide-react";

import type { DashboardTab, NavItemConfig } from "./types";

export const CUSTOMER_ROUTE = "/customer";
export const HOME_ROUTE = "/";
export const OPEN_NOTIFICATIONS_ROUTE = "/?openNotifications=1";

export const DASHBOARD_NAV_ID = "dashboard-navigation";

/** Query params written by the AI concierge / notifications deep links. */
export const TAB_PARAM = "tab";
export const RATE_ORDER_PARAM = "rateOrder";
export const CANCEL_BOOKING_PARAM = "cancelBooking";

export const DEFAULT_CURRENCY = "USD";
export const FAV_ERROR_TIMEOUT_MS = 5_000;

export const VALID_TABS: readonly DashboardTab[] = [
  "orders",
  "favorites",
  "bookings",
  "coupons",
];

export const PAST_ORDER_STATUSES: readonly string[] = [
  "completed",
  "declined",
  "refunded",
];

export const INACTIVE_BOOKING_STATUSES: readonly string[] = [
  "completed",
  "cancelled",
];

export const FAVORITES_SELECT = `
  id,
  item_id,
  catalog_items:catalog_items_public(
    id,
    name,
    numeric_price,
    category
  )
`;

export const FAVORITES_ERROR_MESSAGE =
  "Couldn't remove that favorite. Please try again.";

export const NAV_ITEMS: readonly NavItemConfig[] = [
  {
    id: "orders",
    label: "Orders",
    Icon: Timer,
    badge: { tone: "blue", ariaLabel: (n) => `${n} active orders` },
  },
  {
    id: "bookings",
    label: "Bookings",
    Icon: Calendar,
    badge: { tone: "blue", ariaLabel: (n) => `${n} active bookings` },
  },
  {
    id: "favorites",
    label: "Favorites",
    Icon: Heart,
    badge: { tone: "red", ariaLabel: (n) => `${n} favorites` },
  },
  {
    id: "coupons",
    label: "Coupons",
    Icon: Tag,
  },
];