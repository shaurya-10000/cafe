import { useCallback } from "react";

import { useRouter } from "next/navigation";

import {
  CART_QUERY_PATH,
  HOME_PATH,
  MENU_ANCHOR_PATH,
  MENU_SECTION_ID,
} from "../constants";

interface UseHeaderNavigationOptions {
  pathname: string | null;
  prefersReducedMotion: boolean;
  setCartOpen: (open: boolean) => void;
}

export interface UseHeaderNavigationResult {
  onOrderClick: () => void;
  onCartClick: () => void;
}

export function useHeaderNavigation({
  pathname,
  prefersReducedMotion,
  setCartOpen,
}: UseHeaderNavigationOptions): UseHeaderNavigationResult {
  const router = useRouter();

  const onOrderClick = useCallback(() => {
    if (pathname === HOME_PATH) {
      document.getElementById(MENU_SECTION_ID)?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      return;
    }

    router.push(MENU_ANCHOR_PATH);
  }, [pathname, prefersReducedMotion, router]);

  const onCartClick = useCallback(() => {
    if (pathname === HOME_PATH) {
      setCartOpen(true);
      return;
    }

    router.push(CART_QUERY_PATH);
  }, [pathname, router, setCartOpen]);

  return { onOrderClick, onCartClick };
}
