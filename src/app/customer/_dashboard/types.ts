import type { Dispatch, SetStateAction } from "react";
import type { LucideIcon } from "lucide-react";

import type { useSupabaseClient } from "@/utils/supabase/client";

import type { BookingRow } from "../components/BookingsTab";
import type { FavoriteItem } from "../components/FavoritesTab";
import type { OrderRow, OrderView } from "../components/OrdersTab";

export type { BookingRow, FavoriteItem, OrderRow, OrderView };

export type DashboardTab = "orders" | "favorites" | "bookings" | "coupons";

export type DashboardSupabaseClient = ReturnType<typeof useSupabaseClient>;

/** Structural ref type so both React 18 and 19 ref objects are assignable. */
export interface MountedRef {
  readonly current: boolean;
}

export interface ResolvedTab {
  tab: DashboardTab;
  view?: OrderView;
}

export type BadgeTone = "blue" | "red";

export interface NavItemConfig {
  id: DashboardTab;
  label: string;
  Icon: LucideIcon;
  badge?: {
    tone: BadgeTone;
    ariaLabel: (count: number) => string;
  };
}

export type NavCounts = Partial<Record<DashboardTab, number>>;

export interface DashboardNavigation {
  activeTab: DashboardTab;
  orderView: OrderView;
  setOrderView: Dispatch<SetStateAction<OrderView>>;
  rateOrderId: string | undefined;
  selectTab: (tab: DashboardTab) => void;
  clearRateOrder: () => void;
}