import { useCallback, useRef, useState } from "react";

import { toast } from "sonner";

import {
  deleteCoupon,
  toggleCoupon,
  type Coupon,
} from "@/app/admin/actions/couponActions";

import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseCouponActionsOptions {
  /** Called after every attempt so the list reflects the server state. */
  onChanged: () => void;
}

export interface UseCouponActionsResult {
  /** Id of the coupon being toggled (drives the row spinner). */
  togglingId: string | null;
  toggle: (coupon: Coupon) => Promise<void>;
  /** Soft-delete: the coupon is disabled, not removed. */
  remove: (coupon: Coupon) => Promise<void>;
}

/**
 * Enable/disable and soft-delete. Shared by the row buttons and the AI
 * concierge, so both report outcomes identically. One toggle runs at a time.
 */
export function useCouponActions({
  onChanged,
}: UseCouponActionsOptions): UseCouponActionsResult {
  const isMounted = useIsMounted();
  const onChangedRef = useLatestRef(onChanged);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const toggle = useCallback(
    async (coupon: Coupon): Promise<void> => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setTogglingId(coupon.id);

      try {
        const result = await toggleCoupon(coupon.id, !coupon.is_active);

        if (!isMounted()) return;

        if (!result.success) {
          console.error("[CouponsTab] toggle failed", {
            couponId: coupon.id,
            error: result.error,
          });

          toast.error(result.error ?? "Failed to toggle coupon.");
        } else {
          toast.success(coupon.is_active ? "Coupon disabled." : "Coupon enabled.");
        }
      } catch (error) {
        if (!isMounted()) return;

        console.error("[CouponsTab] toggle threw", { couponId: coupon.id }, error);
        toast.error("Failed to toggle coupon.");
      } finally {
        inFlightRef.current = false;

        if (isMounted()) setTogglingId(null);

        onChangedRef.current();
      }
    },
    [isMounted, onChangedRef],
  );

  const remove = useCallback(
    async (coupon: Coupon): Promise<void> => {
      if (!window.confirm(`Disable coupon "${coupon.code}"? (Soft-delete)`)) {
        return;
      }

      try {
        const result = await deleteCoupon(coupon.id);

        if (!isMounted()) return;

        if (!result.success) {
          console.error("[CouponsTab] delete failed", {
            couponId: coupon.id,
            error: result.error,
          });

          toast.error(result.error ?? "Failed to disable coupon.");
        } else {
          toast.success("Coupon disabled.");
        }
      } catch (error) {
        if (!isMounted()) return;

        console.error("[CouponsTab] delete threw", { couponId: coupon.id }, error);
        toast.error("Failed to disable coupon.");
      } finally {
        onChangedRef.current();
      }
    },
    [isMounted, onChangedRef],
  );

  return { togglingId, toggle, remove };
}
