"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  assembleActionFromState,
  clearExpiredState,
  describeMissingField,
  mergeUserReply,
} from "@/lib/ai/slotFilling";
import type { PartialActionState } from "@/types/action";

import { MESSAGES, PENDING_ACTION_STORAGE_PREFIX } from "../constants";
import type { ConsumeReplyResult, UsePendingActionResult } from "../types";

/** Reads the persisted slot-fill state; expired or corrupt payloads read as absent. */
function readStoredState(sessionKey: string): PartialActionState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(sessionKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PartialActionState | null;
    if (!parsed || typeof parsed !== "object") return null;

    return clearExpiredState(parsed);
  } catch {
    return null;
  }
}

/**
 * Wraps `lib/ai/slotFilling.ts` with React state and a sessionStorage mirror.
 * The slot machine itself is pure; this hook is the stateful shell around it.
 *
 * Ownership: pending state is per-`storageKey`, so a half-collected
 * reservation on the customer widget never leaks into the admin widget.
 *
 * Expiry: on read, `clearExpiredState` is applied; a state older than
 * `SLOT_FILL_STATE_TTL_MS` is dropped (and the mirror effect then removes it
 * from storage).
 */
export function usePendingAction(storageKey: string): UsePendingActionResult {
  const sessionKey = `${PENDING_ACTION_STORAGE_PREFIX}${storageKey}`;

  // The widget renders nothing until it has mounted, so reading storage in the
  // initializer cannot cause a hydration mismatch.
  const [pendingState, setPendingState] = useState<PartialActionState | null>(
    () => readStoredState(sessionKey),
  );

  // A different storage key means a different pending context: reload it.
  const [loadedKey, setLoadedKey] = useState(sessionKey);
  if (loadedKey !== sessionKey) {
    setLoadedKey(sessionKey);
    setPendingState(readStoredState(sessionKey));
  }

  // Mirror state changes to sessionStorage.
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (pendingState === null) {
        window.sessionStorage.removeItem(sessionKey);
      } else {
        window.sessionStorage.setItem(sessionKey, JSON.stringify(pendingState));
      }
    } catch {
      // Storage full or disabled: pending state lives in memory only.
    }
  }, [pendingState, sessionKey]);

  const beginCollecting = useCallback((state: PartialActionState) => {
    setPendingState(state);
  }, []);

  const clear = useCallback(() => {
    setPendingState(null);
  }, []);

  const consumeReply = useCallback(
    (replyText: string): ConsumeReplyResult => {
      if (!pendingState) return null;

      const merged = mergeUserReply(pendingState, replyText);

      if (merged.lastParseFailed) {
        return {
          status: "failed",
          prompt: describeMissingField(
            pendingState.type,
            pendingState.missingField,
          ),
        };
      }

      // All fields present: assemble and return the dispatchable action.
      if (merged.missingField === "") {
        const assembled = assembleActionFromState(merged);
        setPendingState(null);

        if (assembled) {
          return { status: "ready", action: assembled };
        }

        // assemble returned null despite missingField === "": only a bug in
        // the slot machine does that. Clear and surface a generic retry
        // prompt rather than silently looping.
        return { status: "failed", prompt: MESSAGES.slotRetry };
      }

      // Still collecting the next field.
      setPendingState(merged);
      return {
        status: "ask",
        prompt: describeMissingField(merged.type, merged.missingField),
      };
    },
    [pendingState],
  );

  const pendingPrompt = useMemo(() => {
    if (!pendingState) return null;
    if (!pendingState.missingField) return null;
    return describeMissingField(pendingState.type, pendingState.missingField);
  }, [pendingState]);

  return { pendingState, pendingPrompt, beginCollecting, consumeReply, clear };
}