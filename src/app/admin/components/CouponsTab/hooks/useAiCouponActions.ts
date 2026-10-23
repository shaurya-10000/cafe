import { useEffect } from "react";

import { toast } from "sonner";

import type { Coupon } from "@/app/admin/actions/couponActions";
import {
  ADMIN_TOGGLE_COUPON_ACTIVE,
  ADMIN_UPDATE_GAME_REWARD,
  listenCafeEvent,
} from "@/lib/core/events";

import { AI_ACTION_SETTLE_MS, REWARD_KEY } from "../constants";
import { rewardPatchFromEvent } from "../lib/reward";
import type { GameRewardPatch } from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseAiCouponActionsOptions {
  coupons: readonly Coupon[];
  toggleCoupon: (coupon: Coupon) => Promise<void>;
  saveGameReward: (patch: GameRewardPatch) => Promise<void>;
}

/**
 * ChatWidget dispatches these when an admin confirms the AI's
 * TOGGLE_COUPON_ACTIVE / UPDATE_GAME_REWARD actions.
 *
 * A short delay lets ChatWidget's router.push to /admin?tab=coupons settle
 * before the handler runs, so the tab isn't mid-mount. The current coupons
 * are read through a ref and both actions are stable, so the listeners
 * register once: ChatWidget fires these events right after a route change,
 * and a listener torn down and rebuilt by a refetch could drop the event in
 * the gap.
 */
export function useAiCouponActions({
  coupons,
  toggleCoupon,
  saveGameReward,
}: UseAiCouponActionsOptions): void {
  const isMounted = useIsMounted();
  const couponsRef = useLatestRef(coupons);

  useEffect(() => {
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const schedule = (run: () => void): void => {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);

        if (!isMounted()) return;

        run();
      }, AI_ACTION_SETTLE_MS);

      pendingTimers.add(timer);
    };

    const removeCouponListener = listenCafeEvent<{ id?: unknown }>(
      ADMIN_TOGGLE_COUPON_ACTIVE,
      (event) => {
        const id = event.detail?.id;

        if (typeof id !== "string") return;

        schedule(() => {
          // Find the target by id in the currently loaded list.
          const target = couponsRef.current.find((coupon) => coupon.id === id);

          if (!target) {
            toast.error("That coupon was not found. It may have been removed.");
            return;
          }

          void toggleCoupon(target);
        });
      },
    );

    const removeRewardListener = listenCafeEvent<{
      rewardKey?: unknown;
      title?: unknown;
      promoCode?: unknown;
      discountValue?: unknown;
      description?: unknown;
      isActive?: unknown;
    }>(ADMIN_UPDATE_GAME_REWARD, (event) => {
      const detail = event.detail;

      if (!detail || detail.rewardKey !== REWARD_KEY) return;

      const patch = rewardPatchFromEvent(detail);

      if (Object.keys(patch).length === 0) return;

      schedule(() => {
        void saveGameReward(patch);
      });
    });

    return () => {
      removeCouponListener();
      removeRewardListener();

      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, [couponsRef, isMounted, saveGameReward, toggleCoupon]);
}
