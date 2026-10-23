import {
  useCallback,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";

import { updateCatalogItem } from "@/app/admin/actions/catalogActions";
import type { CatalogItem } from "@/types/catalog";

import { TOGGLE_COPY } from "../constants";
import { buildItemInput, toggledPatch } from "../lib/products";
import type { ToggleField } from "../types";
import { useIsMounted } from "./useIsMounted";
import type { UseBannerResult } from "./useBanner";

interface UseItemTogglesOptions {
  setProducts: Dispatch<SetStateAction<CatalogItem[]>>;
  banner: Pick<UseBannerResult, "showError" | "showSuccess" | "clearBanner">;
}

export interface UseItemTogglesResult {
  toggleActive: (item: CatalogItem) => Promise<void>;
  togglePopular: (item: CatalogItem) => Promise<void>;
}

/**
 * Optimistic visibility / popularity toggles (driven by the AI concierge).
 * One toggle runs at a time; on failure the optimistic flip is rolled back.
 * The returned callbacks are stable so event listeners never need to rebind.
 */
export function useItemToggles({
  setProducts,
  banner,
}: UseItemTogglesOptions): UseItemTogglesResult {
  const isMounted = useIsMounted();

  const { showError, showSuccess, clearBanner } = banner;

  const inFlightRef = useRef(false);

  const toggle = useCallback(
    async (item: CatalogItem, field: ToggleField): Promise<void> => {
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      clearBanner();

      const copy = TOGGLE_COPY[field];
      const next = !item[field];

      const applyPatch = (value: boolean): void => {
        const patch = toggledPatch(field, value);

        setProducts((previous) =>
          previous.map((product) =>
            product.id === item.id ? { ...product, ...patch } : product,
          ),
        );
      };

      // Optimistic flip; reverted explicitly on failure.
      applyPatch(next);

      try {
        const result = await updateCatalogItem(
          item.id,
          buildItemInput(item, { [field]: next }),
        );

        if (!isMounted()) return;

        if (!result.ok) throw new Error(result.error);

        showSuccess(next ? copy.on(item.name) : copy.off(item.name));
      } catch (error) {
        if (!isMounted()) return;

        applyPatch(item[field]);

        showError(error instanceof Error ? error.message : copy.fallbackError);
      } finally {
        inFlightRef.current = false;
      }
    },
    [clearBanner, isMounted, setProducts, showError, showSuccess],
  );

  const toggleActive = useCallback(
    (item: CatalogItem) => toggle(item, "is_active"),
    [toggle],
  );

  const togglePopular = useCallback(
    (item: CatalogItem) => toggle(item, "is_popular"),
    [toggle],
  );

  return { toggleActive, togglePopular };
}
