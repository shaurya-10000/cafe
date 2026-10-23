"use client";

import { useEffect, useState } from "react";

import { DEFAULT_CURRENCY } from "../constants";
import type { DashboardSupabaseClient, MountedRef } from "../types";

/**
 * business_settings.currency drives price formatting anywhere this
 * dashboard shows money (FavoritesTab, OrdersTab).
 */
export function useBusinessCurrency(
  supabase: DashboardSupabaseClient,
  isMountedRef: MountedRef,
): string {
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const { data } = await supabase
        .from("business_settings")
        .select("currency")
        .eq("id", true)
        .maybeSingle();

      if (cancelled || !isMountedRef.current) return;
      if (data?.currency) setCurrency(data.currency);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, isMountedRef]);

  return currency;
}