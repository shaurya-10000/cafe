import type { ViewOption } from "./types";

export const DEFAULT_CURRENCY = "USD";
export const MONEY_LOCALE = "en-US";
export const SCHEDULED_ORDER_TYPE = "scheduled";

export const STATUS_STEPS = ["incoming", "preparing", "ready", "completed"] as const;

export const PAST_STATUSES: ReadonlySet<string> = new Set([
  "completed",
  "declined",
  "refunded",
]);

export const PROGRESS_SPRING = {
  type: "spring",
  stiffness: 50,
  damping: 15,
} as const;

export const VIEW_OPTIONS: readonly ViewOption[] = [
  {
    id: "active",
    label: "Active",
    emptyLabel: "active",
    focusRingClass: "focus-visible:ring-blue-600",
    activeClass: "bg-blue-600 text-white shadow-lg shadow-blue-600/20",
  },
  {
    id: "advanced",
    label: "Scheduled",
    emptyLabel: "scheduled",
    focusRingClass: "focus-visible:ring-orange-500",
    activeClass: "bg-orange-500 text-white shadow-lg shadow-orange-500/20",
  },
  {
    id: "past",
    label: "Past",
    emptyLabel: "past",
    focusRingClass: "focus-visible:ring-cafe-fg",
    activeClass: "bg-cafe-fg/10 text-cafe-fg",
  },
];