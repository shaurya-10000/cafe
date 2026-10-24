"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { computePlacement } from "./placement";
import type { MenuPlacement, MessageMenuAction } from "./types";

const DEFAULT_PLACEMENT: MenuPlacement = { vertical: "down", horizontal: "start" };
const ITEM_SELECTOR = '[role="menuitem"]';

/**
 * Open/close state, placement and keyboard behavior for a message menu.
 * Escape is handled in the capture phase so it closes only the menu, not the
 * chat dialog that contains it.
 */
export function useMessageMenu(itemCount: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<MenuPlacement>(DEFAULT_PLACEMENT);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const toggle = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    const trigger = triggerRef.current;
    if (trigger) setPlacement(computePlacement(trigger, itemCount));
    setIsOpen(true);
  }, [isOpen, itemCount]);

  const select = useCallback((action: MessageMenuAction) => {
    setIsOpen(false);
    triggerRef.current?.focus();
    action.onSelect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [isOpen]);

  const handleMenuKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? [],
      );
      if (items.length === 0) return;

      const current = items.indexOf(document.activeElement as HTMLElement);
      const focusAt = (index: number) => items[(index + items.length) % items.length]?.focus();

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusAt(current + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusAt(current - 1);
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(items.length - 1);
          break;
        case "Tab":
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
      }
    },
    [],
  );

  return {
    isOpen,
    placement,
    menuId,
    triggerRef,
    menuRef,
    toggle,
    select,
    handleMenuKeyDown,
  };
}
