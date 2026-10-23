"use client";

import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { warnIfNotFocusable } from "../lib/focus";

interface UseFocusRestoreOptions {
  buttonRef: RefObject<HTMLButtonElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Whether the FAB is currently rendered (not exiting). */
  isVisible: boolean;
}

/**
 * Restores focus after the exit animation, only if the FAB owned keyboard
 * focus when it began exiting and the target is still mounted.
 *
 * `onBlur` is unreliable when AnimatePresence unmounts a focused node, so
 * focus is also snapshotted from `document.activeElement` on every visible
 * render.
 */
export function useFocusRestore({
  buttonRef,
  returnFocusRef,
  isVisible,
}: UseFocusRestoreOptions) {
  const isFocusedRef = useRef(false);
  const hadFocusAtExitRef = useRef(false);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const node = buttonRef.current;
    hadFocusAtExitRef.current = node
      ? document.activeElement === node
      : isFocusedRef.current;
  });

  const handleExitComplete = useCallback(() => {
    const ownedFocus = isFocusedRef.current || hadFocusAtExitRef.current;

    isFocusedRef.current = false;
    hadFocusAtExitRef.current = false;

    if (!ownedFocus) return;

    const target = returnFocusRef?.current;
    if (!target || !target.isConnected) return;

    warnIfNotFocusable(target);
    target.focus();
  }, [returnFocusRef]);

  return { handleFocus, handleBlur, handleExitComplete };
}