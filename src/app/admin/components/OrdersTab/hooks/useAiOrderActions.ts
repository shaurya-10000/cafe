import { useEffect } from "react";

import {
  ADMIN_TOGGLE_ORDER_PAID,
  ADMIN_UPDATE_ORDER_STATUS,
  listenCafeEvent,
} from "@/lib/core/events";

import { AI_ACTION_SETTLE_MS } from "../constants";
import type { UseOrderActionsResult } from "./useOrderActions";

/**
 * Forwards AI-concierge events to the tab's own action handlers, which stay
 * the single source of truth for the outcome (toasts, refresh).
 *
 * The listeners are registered once: `updateStatus` / `setPaid` are stable,
 * so a dropped-and-rebound window can never lose an event.
 */
export function useAiOrderActions({
  updateStatus,
  setPaid,
}: UseOrderActionsResult): void {
  useEffect(() => {
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const schedule = (run: () => void): void => {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);
        run();
      }, AI_ACTION_SETTLE_MS);

      pendingTimers.add(timer);
    };

    const removeStatusListener = listenCafeEvent<{
      orderId?: unknown;
      status?: unknown;
    }>(ADMIN_UPDATE_ORDER_STATUS, (event) => {
      const { orderId, status } = event.detail ?? {};

      if (typeof orderId !== "string" || typeof status !== "string") return;

      schedule(() => {
        void updateStatus(orderId, status, { announce: true });
      });
    });

    const removePaidListener = listenCafeEvent<{
      orderId?: unknown;
      isPaid?: unknown;
    }>(ADMIN_TOGGLE_ORDER_PAID, (event) => {
      const { orderId, isPaid } = event.detail ?? {};

      if (typeof orderId !== "string" || typeof isPaid !== "boolean") return;

      schedule(() => {
        void setPaid(orderId, isPaid, { announce: true });
      });
    });

    return () => {
      removeStatusListener();
      removePaidListener();

      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, [setPaid, updateStatus]);
}
