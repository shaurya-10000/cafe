"use client";

import { useEffect, useState } from "react";

import { getCustomerCoupons } from "@/app/admin/actions/couponActions";
import { useIsMountedRef } from "@/hooks/useIsMountedRef";
import { useSupabaseClient } from "@/utils/supabase/client";

import { claimToCoupon, mergeCoupons } from "../lib/claimedRewards";
import type { ClaimedRewardRow, Coupon } from "../types";

type SupabaseClient = ReturnType<typeof useSupabaseClient>;

interface LoadedCoupons {
  coupons: Coupon[];
  /** Upper-cased codes this customer can no longer redeem (already used, etc.). */
  unavailableCodes: ReadonlySet<string>;
}

const EMPTY_CODES: ReadonlySet<string> = new Set();

/**
 * The database's own answer to "which coupons can this customer still use",
 * the same rule checkout enforces (per-customer limit, expiry, usage cap).
 * Null when the lookup fails, so the list degrades instead of hiding coupons.
 */
async function fetchRedeemableCodes(
  supabase: SupabaseClient,
): Promise<Set<string> | null> {
  const { data, error } = await supabase.rpc("list_my_redeemable_coupons");

  if (error) {
    console.error("[CouponsTab] failed to load redeemable coupons", error);
    return null;
  }

  const codes = new Set<string>();

  for (const row of (data ?? []) as { code?: string | null }[]) {
    if (row.code) codes.add(row.code.toUpperCase());
  }

  return codes;
}

async function fetchCoupons(
  supabase: SupabaseClient,
  userId: string | undefined,
): Promise<LoadedCoupons> {
  const [realCoupons, claimedRewardsRes, redeemable] = await Promise.all([
    getCustomerCoupons(),
    userId
      ? supabase.from("user_claimed_rewards").select("*").eq("user_id", userId)
      : Promise.resolve({ data: null, error: null }),
    userId ? fetchRedeemableCodes(supabase) : Promise.resolve(null),
  ]);

  let coupons: Coupon[] = [...realCoupons];

  if (claimedRewardsRes.error) {
    console.error(
      "[CouponsTab] failed to load claimed game rewards",
      { userId },
      claimedRewardsRes.error,
    );
  } else if (claimedRewardsRes.data) {
    const rewardCoupons = (claimedRewardsRes.data as ClaimedRewardRow[]).map(
      claimToCoupon,
    );

    coupons = mergeCoupons(realCoupons, rewardCoupons);
  }

  if (!redeemable) return { coupons, unavailableCodes: EMPTY_CODES };

  const unavailableCodes = new Set<string>();

  for (const coupon of coupons) {
    const code = coupon.code.toUpperCase();

    if (!redeemable.has(code)) unavailableCodes.add(code);
  }

  return { coupons, unavailableCodes };
}

/** Admin-defined coupons plus the user's claimed game rewards. */
export function useCoupons(userId: string | undefined) {
  const supabase = useSupabaseClient();
  const isMountedRef = useIsMountedRef();

  const [loaded, setLoaded] = useState<LoadedCoupons>({
    coupons: [],
    unavailableCodes: EMPTY_CODES,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);

      try {
        const next = await fetchCoupons(supabase, userId);
        if (cancelled || !isMountedRef.current) return;
        setLoaded(next);
      } catch (error) {
        console.error("[CouponsTab] failed to load coupons", error);
        if (cancelled || !isMountedRef.current) return;
        setLoaded({ coupons: [], unavailableCodes: EMPTY_CODES });
      } finally {
        if (!cancelled && isMountedRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, userId, isMountedRef]);

  return {
    coupons: loaded.coupons,
    unavailableCodes: loaded.unavailableCodes,
    loading,
  };
}