import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { buildRateOrderHref, resolveNotificationAction } from "../lib/routes";
import type { NotificationRow } from "../types";

interface Options {
  readonly isAdmin: boolean;
  readonly onClose: () => void;
}

/** Routes a clicked notification to its destination and closes the drawer. */
export function useNotificationNavigation({ isAdmin, onClose }: Options) {
  const router = useRouter();

  const openNotification = useCallback(
    (notification: NotificationRow) => {
      const action = resolveNotificationAction(notification, isAdmin);
      if (action.type === "ignore") return;
      if (action.type === "navigate") router.push(action.href);
      onClose();
    },
    [isAdmin, router, onClose],
  );

  const rateOrder = useCallback(
    (orderId: string) => {
      router.push(buildRateOrderHref(orderId));
      onClose();
    },
    [router, onClose],
  );

  return { openNotification, rateOrder };
}
