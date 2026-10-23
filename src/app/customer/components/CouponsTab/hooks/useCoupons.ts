"use client";

import { useEffect, useState } from "react";

import { getCustomerCoupons } from "@/app/admin/actions/couponActions";
import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import { claimToCoupon, mergeCoupons } from "../lib/claimedRewards";
import type { ClaimedRewardRow, Coupon } from "../types";

type SupabaseClient = ReturnType<typeof useSupabaseClient>;

async function fetchCoupons(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<Coupon[]> {
  const [realCoupons, claimedRewardsRes] = await Promise.all([
    getCustomerCoupons(),
    userId
      ? supabase.from("user_claimed_rewards").select("*").eq("user_id", userId)
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (claimedRewardsRes.error) {
    console.error(
      "[CouponsTab] failed to load claimed game rewards",
      { userId },
      claimedRewardsRes.error,
    );
    return [...realCoupons];
  }

  if (!claimedRewardsRes.data) {
    return [...realCoupons];
  }

  const rewardCoupons = (claimedRewardsRes.data as ClaimedRewardRow[]).map(
    claimToCoupon,
  );

  return mergeCoupons(realCoupons, rewardCoupons);
}

/** Admin-defined coupons plus the user's claimed game rewards. */
export function useCoupons(userId: string | undefined) {
  const supabase = useSupabaseClient();
  const isMountedRef = useIsMountedRef();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);

      try {
        const loaded = await fetchCoupons(supabase, userId);
        if (cancelled || !isMountedRef.current) return;
        setCoupons(loaded);
      } catch (error) {
        console.error("[CouponsTab] failed to load coupons", error);
        if (cancelled || !isMountedRef.current) return;
        setCoupons([]);
      } finally {
        if (!cancelled && isMountedRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, isMountedRef]);

  return { coupons, loading };
}