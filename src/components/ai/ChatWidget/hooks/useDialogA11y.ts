"use client";

import { useEffect, useRef } from "react";

import { trapTab } from "../lib/focusTrap";

interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal-dialog accessibility for the widget: focus moves in on open and is
 * restored on close, Escape closes, and Tab is trapped inside.
 *
 * The Escape handler ignores events another handler already consumed (for
 * example the session menu's own Escape), so closing a menu no longer closes
 * the whole chat with it.
 */
export function useDialogA11y({ isOpen, onClose }: UseDialogA11yOptions) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) return;

    const target = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;

    if (target && document.body.contains(target)) {
      requestAnimationFrame(() => target.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialogRef.current) return;
      trapTab(event, dialogRef.current);
    };

    document.addEventListener("keydown", handleTab);
    return () => document.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  return dialogRef;
}