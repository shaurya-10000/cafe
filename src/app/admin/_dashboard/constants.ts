import {
  BarChart2,
  Calendar,
  MapPin,
  Package,
  ShoppingCart,
  Tag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type {
  AdminTab,
  OrderType,
  PaymentMethod,
  SplitKey,
  TimeRange,
} from "./types";

export const DEFAULT_TAB: AdminTab = "orders";
export const DEFAULT_TIME_RANGE: TimeRange = "7d";
export const DEFAULT_CURRENCY = "USD";

export const ADMIN_PATH = "/admin";
export const HOME_PATH = "/";

export const SIDEBAR_ID = "admin-navigation";
export const SIDEBAR_TITLE_ID = "admin-navigation-title";

/** Coalesces bursts of realtime events into a single refetch. */
export const REALTIME_DEBOUNCE_MS = 250;

export const REALTIME_CHANNEL = "admin_live";

export const NAV_ITEMS = [
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "reservations", label: "Reservations", icon: Calendar },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "branches", label: "Branches", icon: MapPin },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
  { id: "coupons", label: "Coupons", icon: Tag },
] as const satisfies ReadonlyArray<{
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}>;

export const VALID_TABS: ReadonlySet<string> = new Set(
  NAV_ITEMS.map((item) => item.id),
);

export const TAB_LABELS = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.id, item.label]),
) as Record<AdminTab, string>;

export const ADMIN_SUGGESTED_PROMPTS = [
  {
    label: "Today's summary",
    icon: TrendingUp,
    prompt: "Give me a summary of today's orders and revenue.",
  },
  {
    label: "Pending reservations",
    icon: Calendar,
    prompt: "What reservations are booked for today?",
  },
  {
    label: "Recent orders",
    icon: BarChart2,
    prompt: "Show me the most recent orders.",
  },
];

const DAY_MS = 24 * 60 * 60 * 1000;

export const TIME_RANGE_WINDOWS: Record<TimeRange, number | null> = {
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
  all: null,
};

/** Order type x payment method -> analytics bucket. */
export const SPLIT_KEYS: Record<OrderType, Record<PaymentMethod, SplitKey>> = {
  delivery: { online: "deliveryOnline", in_person: "deliveryInPerson" },
  pickup: { online: "pickupOnline", in_person: "pickupInPerson" },
  scheduled: { online: "scheduledOnline", in_person: "scheduledInPerson" },
};

export const PIE_SLICES: ReadonlyArray<{
  key: SplitKey;
  name: string;
  color: string;
}> = [
  { key: "deliveryOnline", name: "Delivery \u00b7 Online", color: "#3b82f6" },
  {
    key: "deliveryInPerson",
    name: "Delivery \u00b7 In-person",
    color: "#60a5fa",
  },
  { key: "pickupOnline", name: "Pickup \u00b7 Online", color: "#10b981" },
  { key: "pickupInPerson", name: "Pickup \u00b7 In-person", color: "#34d399" },
  {
    key: "scheduledOnline",
    name: "Scheduled \u00b7 Online",
    color: "#f59e0b",
  },
  {
    key: "scheduledInPerson",
    name: "Scheduled \u00b7 In-person",
    color: "#fbbf24",
  },
];

export const ASSISTANT_CONFIG = {
  assistantType: "admin",
  apiEndpoint: "/api/ai/admin-chat",
  titleEndpoint: "/api/ai/title",
  storageKey: "cafe_admin_chats",
  headerTitle: "Admin Assistant",
  emptyStateTitle: "Cafe Admin Assistant",
  emptyStateSubtitle: "Ask about today's orders, reservations, or branch status.",
  accentGradientClassName:
    "bg-gradient-to-br from-cafe-accent via-cafe-accent/90 to-cafe-accent/80",
} as const;
