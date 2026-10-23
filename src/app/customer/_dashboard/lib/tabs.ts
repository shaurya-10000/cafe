import { VALID_TABS } from "../constants";
import type { DashboardTab, ResolvedTab } from "../types";

export function isDashboardTab(value: string): value is DashboardTab {
  return (VALID_TABS as readonly string[]).includes(value);
}

/**
 * Legacy alias map: the tab id used to be split between "active" and
 * "history", and every producer of a deep link (ChatWidget's RATE_ORDER and
 * VIEW_ORDERS, NotificationsSidebar's review_prompt click) still points at
 * one of those old ids. Rather than touching every producer, they are
 * translated here. `history` maps to the orders tab with view="past";
 * `active` maps to the orders tab with view="active".
 */
export function resolveTabAlias(raw: string | null): ResolvedTab | null {
  if (!raw) return null;
  if (raw === "history") return { tab: "orders", view: "past" };
  if (raw === "active") return { tab: "orders", view: "active" };
  if (isDashboardTab(raw)) return { tab: raw };
  return null;
}