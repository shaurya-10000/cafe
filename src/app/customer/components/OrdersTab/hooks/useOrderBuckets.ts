"use client";

import { useMemo } from "react";

import { partitionOrders } from "../lib/orders";
import type { OrderBuckets, OrderRow } from "../types";

export function useOrderBuckets(orders: readonly OrderRow[]): OrderBuckets {
  return useMemo(() => partitionOrders(orders), [orders]);
}