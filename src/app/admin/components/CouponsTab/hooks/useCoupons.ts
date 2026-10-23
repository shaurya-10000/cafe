import { useCallback, useEffect, useState } from "react";

import {
  getAllAdminCoupons,
  type Coupon,
} from "@/app/admin/actions/couponActions";
import { useSupabaseClient } from "@/utils/supabase/client";

import { useIsMounted } from "./useIsMounted";

export interface UseCouponsResult {
  coupons: Coupon[];
  /** `true` only for the first load; later refreshes are silent. */
  loading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Loads every coupon through the admin server action and refetches whenever
 * the `coupons` table changes. Refetches after the first load are silent, so
 * the list never flashes a spinner when a row is toggled or edited.
 */
export function useCoupons(): UseCouponsResult {
  const supabase = useSupabaseClient();
  const isMounted = useIsMounted();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const data = await getAllAdminCoupons();

      if (!isMounted()) return;

      if (data) setCoupons(data);
    } catch (error) {
      console.error("[CouponsTab] coupons fetch failed", error);
    } finally {
      if (isMounted()) setLoading(false);
    }
  }, [isMounted]);

  useEffect(() => {
    void refresh();

    // Unique per effect run: re-using a channel name would hand back the
    // already-subscribed channel (React Strict Mode runs effects twice).
    const channel = supabase
      .channel(`coupons_admin_coupons_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coupons" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, supabase]);

  return { coupons, loading, refresh };
}
