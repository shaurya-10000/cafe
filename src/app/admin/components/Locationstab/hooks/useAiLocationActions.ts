import { useEffect } from "react";

import { toast } from "sonner";

import {
  ADMIN_TOGGLE_BRANCH_ACTIVE,
  listenCafeEvent,
} from "@/lib/core/events";

import { AI_ACTION_SETTLE_MS } from "../constants";
import type { AdminLocation } from "../types";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseAiLocationActionsOptions {
  locations: readonly AdminLocation[];
  toggleActive: (
    location: AdminLocation,
    options?: { confirm?: boolean },
  ) => Promise<void>;
}

/**
 * ChatWidget dispatches this when an admin confirms the AI's
 * TOGGLE_BRANCH_ACTIVE action. The listener finds the target location by id
 * and runs the same `toggleActive` used by the tab's own buttons.
 *
 * Semantics: the AI's action is a *toggle*, not a "set to true/false", so
 * the flip always goes the opposite way of the current value. The confirm
 * dialog is skipped (the chat already asked once).
 *
 * The short delay lets ChatWidget's router.push to /admin?tab=branches
 * settle before the handler runs. `locations` is read through a ref and
 * `toggleActive` is stable, so the listener registers once: `locations`
 * changes on every `router.refresh()` after a mutation, and re-registering
 * mid-flight would drop an AI event that arrived in the gap.
 */
export function useAiLocationActions({
  locations,
  toggleActive,
}: UseAiLocationActionsOptions): void {
  const isMounted = useIsMounted();
  const locationsRef = useLatestRef(locations);

  useEffect(() => {
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const removeListener = listenCafeEvent<{ id?: unknown }>(
      ADMIN_TOGGLE_BRANCH_ACTIVE,
      (event) => {
        const id = event.detail?.id;

        if (typeof id !== "string") return;

        const timer = setTimeout(() => {
          pendingTimers.delete(timer);

          if (!isMounted()) return;

          const target = locationsRef.current.find((location) => location.id === id);

          if (!target) {
            toast.error("That location was not found. It may have been removed.");
            return;
          }

          void toggleActive(target, { confirm: false });
        }, AI_ACTION_SETTLE_MS);

        pendingTimers.add(timer);
      },
    );

    return () => {
      removeListener();

      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, [isMounted, locationsRef, toggleActive]);
}
