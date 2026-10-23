import { useCallback } from "react";

import { toast } from "sonner";

import { getActionFailure } from "../lib/actionResult";
import type { OrdersTabProps } from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface ActionOptions {
  /** Show a success toast (used for AI-driven actions, which have no other feedback). */
  announce?: boolean;
}

interface UseOrderActionsOptions {
  onStatusUpdate: OrdersTabProps["handleStatusUpdate"];
  onPaymentToggle: OrdersTabProps["handlePaymentToggle"];
}

export interface UseOrderActionsResult {
  updateStatus: (
    orderId: string,
    status: string,
    options?: ActionOptions,
  ) => Promise<void>;
  setPaid: (
    orderId: string,
    isPaid: boolean,
    options?: ActionOptions,
  ) => Promise<void>;
}

/**
 * The single place where order mutations are run and reported.
 *
 * Handles both failure modes: a thrown error (network, server crash) and a
 * `{ success: false, error }` result, which the admin server actions return
 * instead of throwing. Callbacks are read through refs, so the returned
 * functions are stable even if the parent passes new closures.
 */
export function useOrderActions({
  onStatusUpdate,
  onPaymentToggle,
}: UseOrderActionsOptions): UseOrderActionsResult {
  const isMounted = useIsMounted();

  const onStatusUpdateRef = useLatestRef(onStatusUpdate);
  const onPaymentToggleRef = useLatestRef(onPaymentToggle);

  const updateStatus = useCallback(
    async (
      orderId: string,
      status: string,
      options: ActionOptions = {},
    ): Promise<void> => {
      try {
        const result = await onStatusUpdateRef.current(orderId, status);

        if (!isMounted()) return;

        const failure = getActionFailure(result);

        if (failure) {
          toast.error(failure);
          return;
        }

        if (options.announce) toast.success(`Order marked ${status}.`);
      } catch (error) {
        if (!isMounted()) return;

        console.error(
          "[OrdersTab] status update failed",
          { orderId, status },
          error,
        );
        toast.error("Couldn't update that order. Please try again.");
      }
    },
    [isMounted, onStatusUpdateRef],
  );

  const setPaid = useCallback(
    async (
      orderId: string,
      isPaid: boolean,
      options: ActionOptions = {},
    ): Promise<void> => {
      try {
        const result = await onPaymentToggleRef.current(orderId, isPaid);

        if (!isMounted()) return;

        const failure = getActionFailure(result);

        if (failure) {
          toast.error(failure);
          return;
        }

        if (options.announce) {
          toast.success(isPaid ? "Marked as paid." : "Marked as unpaid.");
        }
      } catch (error) {
        if (!isMounted()) return;

        console.error(
          "[OrdersTab] payment toggle failed",
          { orderId, isPaid },
          error,
        );
        toast.error("Couldn't update payment status. Please try again.");
      }
    },
    [isMounted, onPaymentToggleRef],
  );

  return { updateStatus, setPaid };
}
