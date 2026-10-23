import { useCallback, useEffect, useRef, useState } from "react";

import { VIEW_SWAP_RESET_MS } from "../constants";
import type { View } from "../types";
import { useIsMounted } from "./useIsMounted";

interface UseSidebarViewOptions {
  isOpen: boolean;
  onClose: () => void;
}

export interface UseSidebarViewResult {
  view: View;
  showCart: () => void;
  showOptions: () => void;
  /** Closes the sidebar and resets to the cart view after the exit animation. */
  close: () => void;
  /** Attach to the heading; it receives focus whenever the view changes. */
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}

export function useSidebarView({
  isOpen,
  onClose,
}: UseSidebarViewOptions): UseSidebarViewResult {
  const isMounted = useIsMounted();

  const [view, setView] = useState<View>("cart");

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearResetTimeout = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  // Never reset the view under a sidebar that was reopened in the meantime.
  useEffect(() => {
    if (isOpen) clearResetTimeout();
  }, [clearResetTimeout, isOpen]);

  useEffect(() => clearResetTimeout, [clearResetTimeout]);

  const showCart = useCallback(() => setView("cart"), []);
  const showOptions = useCallback(() => setView("options"), []);

  const close = useCallback(() => {
    onClose();

    clearResetTimeout();

    resetTimeoutRef.current = setTimeout(() => {
      resetTimeoutRef.current = null;

      if (!isMounted()) return;

      setView("cart");
    }, VIEW_SWAP_RESET_MS);
  }, [clearResetTimeout, isMounted, onClose]);

  // Move focus to the heading when the view changes so screen readers
  // announce the new context.
  useEffect(() => {
    if (!isOpen) return;

    const frame = requestAnimationFrame(() => {
      headingRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [view, isOpen]);

  return { view, showCart, showOptions, close, headingRef };
}
