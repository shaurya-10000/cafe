"use client";

import { useCallback, useState } from "react";

import type { DashboardSupabaseClient, MountedRef, OrderRow } from "../types";

interface UseOrdersOptions {
  supabase: DashboardSupabaseClient;
  userId: string | undefined;
  isMountedRef: MountedRef;
}

export function useOrders({ supabase, userId, isMountedRef }: UseOrdersOptions) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!isMountedRef.current) return;
      if (data) setOrders(data as OrderRow[]);
    } catch (err) {
      console.error("[dashboard] order fetch failed", err);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [supabase, userId, isMountedRef]);

  return { orders, loading, fetchOrders };
}