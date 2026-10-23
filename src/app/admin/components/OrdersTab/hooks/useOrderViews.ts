import { useMemo } from "react";

import {
  filterActiveOrders,
  filterAdvancedOrders,
  filterPastOrders,
  selectOrdersForView,
} from "../lib/orders";
import type { OrderRow, OrderView } from "../types";

export interface UseOrderViewsResult {
  activeCount: number;
  advancedCount: number;
  displayOrders: OrderRow[];
}

export function useOrderViews(
  orders: readonly OrderRow[],
  view: OrderView,
): UseOrderViewsResult {
  const active = useMemo(() => filterActiveOrders(orders), [orders]);
  const advanced = useMemo(() => filterAdvancedOrders(orders), [orders]);
  const past = useMemo(() => filterPastOrders(orders), [orders]);

  const displayOrders = useMemo(
    () => selectOrdersForView(view, { active, advanced, past }),
    [view, active, advanced, past],
  );

  return {
    activeCount: active.length,
    advancedCount: advanced.length,
    displayOrders,
  };
}
