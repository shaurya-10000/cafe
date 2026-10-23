import { useEffect } from "react";

import { toast } from "sonner";

import type { CatalogItem } from "@/types/catalog";
import {
  ADMIN_TOGGLE_ITEM_ACTIVE,
  ADMIN_TOGGLE_ITEM_POPULAR,
  listenCafeEvent,
} from "@/lib/core/events";

import { AI_ACTION_SETTLE_MS } from "../constants";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";
import type { UseItemTogglesResult } from "./useItemToggles";

interface UseAiInventoryActionsOptions extends UseItemTogglesResult {
  products: readonly CatalogItem[];
}

/**
 * ChatWidget dispatches these when an admin confirms the AI's
 * TOGGLE_ITEM_ACTIVE / TOGGLE_ITEM_POPULAR actions. The target is looked up
 * by id in the currently loaded list (rather than trusting the AI's payload
 * to carry a full row), so the toggle always applies to the *current* state.
 *
 * A short delay lets ChatWidget's router.push to /admin?tab=inventory
 * settle before the handler runs. `products` is read through a ref and the
 * toggles are stable, so the listeners register once: re-registering on
 * every list change could drop an event that lands in between.
 */
export function useAiInventoryActions({
  products,
  toggleActive,
  togglePopular,
}: UseAiInventoryActionsOptions): void {
  const isMounted = useIsMounted();
  const productsRef = useLatestRef(products);

  useEffect(() => {
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const schedule = (
      id: string,
      run: (item: CatalogItem) => Promise<void>,
    ): void => {
      const timer = setTimeout(() => {
        pendingTimers.delete(timer);

        if (!isMounted()) return;

        const item = productsRef.current.find((product) => product.id === id);

        if (!item) {
          toast.error("That item was not found. It may have been removed.");
          return;
        }

        void run(item);
      }, AI_ACTION_SETTLE_MS);

      pendingTimers.add(timer);
    };

    const removeActiveListener = listenCafeEvent<{ id?: unknown }>(
      ADMIN_TOGGLE_ITEM_ACTIVE,
      (event) => {
        const id = event.detail?.id;

        if (typeof id !== "string") return;

        schedule(id, toggleActive);
      },
    );

    const removePopularListener = listenCafeEvent<{ id?: unknown }>(
      ADMIN_TOGGLE_ITEM_POPULAR,
      (event) => {
        const id = event.detail?.id;

        if (typeof id !== "string") return;

        schedule(id, togglePopular);
      },
    );

    return () => {
      removeActiveListener();
      removePopularListener();

      for (const timer of pendingTimers) clearTimeout(timer);
      pendingTimers.clear();
    };
  }, [isMounted, productsRef, toggleActive, togglePopular]);
}
