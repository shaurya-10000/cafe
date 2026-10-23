"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { dispatchChatAction } from "@/lib/ai/actions";
import { describeMissingField, evaluateAction } from "@/lib/ai/slotFilling";
import type { ActionPayload, PartialActionState } from "@/types/action";

interface UseActionDispatcherOptions {
  onClose: () => void;
  userId: string | null | undefined;
  assistantType: "customer" | "admin";
  reducedMotion: boolean;
  requestConfirmation: (action: ActionPayload) => Promise<boolean>;
  beginCollecting: (state: PartialActionState) => void;
  clearPendingAction: () => void;
  setSlotHint: (hint: string | null) => void;
}

/**
 * Central dispatcher: every action the user (or the model) triggers lands
 * here. Two gates, in order:
 *
 *   1. Slot-fill gate: if the action's type requires fields that aren't all
 *      present, nothing is dispatched. The partial state is stored and a
 *      "collecting..." hint is shown; the user's next message is routed
 *      through `consumeReply`, not the network.
 *   2. Confirmation gate: handled downstream inside `dispatchChatAction` for
 *      DESTRUCTIVE_ACTIONS.
 *
 * Actions with no required fields pass straight through and dispatch.
 */
export function useActionDispatcher({
  onClose,
  userId,
  assistantType,
  reducedMotion,
  requestConfirmation,
  beginCollecting,
  clearPendingAction,
  setSlotHint,
}: UseActionDispatcherOptions) {
  const router = useRouter();

  return useCallback(
    (action: ActionPayload) => {
      const verdict = evaluateAction(action, null);

      if (verdict.status === "collect") {
        beginCollecting(verdict.state);
        setSlotHint(
          describeMissingField(verdict.state.type, verdict.state.missingField),
        );
        return;
      }

      // "dispatch" and "passthrough" both mean: run the action.
      setSlotHint(null);
      clearPendingAction();

      void dispatchChatAction(verdict.action, {
        router,
        onClose,
        userId: userId ?? null,
        assistantType,
        reducedMotion,
        requestConfirmation,
      });
    },
    [
      router,
      onClose,
      userId,
      assistantType,
      reducedMotion,
      requestConfirmation,
      beginCollecting,
      clearPendingAction,
      setSlotHint,
    ],
  );
}