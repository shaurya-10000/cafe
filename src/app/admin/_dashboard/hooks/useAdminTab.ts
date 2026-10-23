"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ADMIN_PATH, DEFAULT_TAB, VALID_TABS } from "../constants";
import type { AdminTab } from "../types";

function isAdminTab(value: string | null): value is AdminTab {
  return value !== null && VALID_TABS.has(value);
}

export interface UseAdminTabResult {
  activeTab: AdminTab;
  selectTab: (tab: AdminTab) => void;
}

/**
 * Active tab, derived from the `?tab=` query parameter.
 *
 * The URL is the source of truth. We do NOT mirror it into state: mirroring
 * requires a setState-in-effect (React 19's `react-hooks/set-state-in-effect`
 * rule) and double-renders on every navigation. `selectTab` simply updates
 * the URL; the derived `activeTab` follows on the next render.
 */
export function useAdminTab(): UseAdminTabResult {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabFromQuery = searchParams.get("tab");
  const activeTab: AdminTab = isAdminTab(tabFromQuery)
    ? tabFromQuery
    : DEFAULT_TAB;

  const selectTab = useCallback(
    (tab: AdminTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${ADMIN_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return { activeTab, selectTab };
}