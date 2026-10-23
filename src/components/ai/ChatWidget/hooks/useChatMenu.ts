"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import { computeMenuPosition } from "../lib/menuPosition";
import type { MenuPosition } from "../types";

/**
 * Per-session actions menu: anchored to its trigger, repositioned on
 * resize/scroll, arrow-key navigable, and returning focus to the trigger on
 * close.
 *
 * The menu is rendered as soon as it has an anchor (hidden until measured)
 * so its size can be read before positioning. Rendering it only after a
 * position existed would deadlock: the position needs the element, and the
 * element needs the position.
 */
export function useChatMenu() {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = useCallback(() => {
    setActiveMenuId(null);
    setAnchorRect(null);
    setPosition(null);

    const trigger = triggerRef.current;
    triggerRef.current = null;

    if (trigger && document.body.contains(trigger)) {
      trigger.focus({ preventScroll: true });
    }
  }, []);

  const openMenu = useCallback(
    (id: string, rect: DOMRect, trigger: HTMLButtonElement) => {
      triggerRef.current = trigger;
      setAnchorRect(rect);
      setPosition(null);
      setActiveMenuId(id);
    },
    [],
  );

  // Measure, then place.
  useLayoutEffect(() => {
    if (!activeMenuId || !anchorRect || !menuRef.current) return;

    const rect = menuRef.current.getBoundingClientRect();

    setPosition(
      computeMenuPosition(
        anchorRect,
        { width: rect.width, height: rect.height },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [activeMenuId, anchorRect]);

  // Follow the trigger through resize / scroll.
  useEffect(() => {
    if (!activeMenuId) return;

    const handleViewportChange = () => {
      const trigger = triggerRef.current;
      if (!trigger || !document.body.contains(trigger)) return;
      setAnchorRect(trigger.getBoundingClientRect());
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [activeMenuId]);

  // Focus the first item once the menu is open.
  useEffect(() => {
    if (!activeMenuId) {
      itemRefs.current = [];
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      itemRefs.current[0]?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeMenuId]);

  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const items = itemRefs.current.filter(
        (item): item is HTMLButtonElement => item !== null,
      );
      if (items.length === 0) return;

      const currentIndex = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          items[(currentIndex + 1 + items.length) % items.length]?.focus();
          break;
        case "ArrowUp":
          event.preventDefault();
          items[(currentIndex - 1 + items.length) % items.length]?.focus();
          break;
        case "Home":
          event.preventDefault();
          items[0]?.focus();
          break;
        case "End":
          event.preventDefault();
          items[items.length - 1]?.focus();
          break;
        case "Escape":
          event.preventDefault();
          closeMenu();
          break;
        default:
          break;
      }
    },
    [closeMenu],
  );

  const registerItem = useCallback(
    (index: number) => (element: HTMLButtonElement | null) => {
      itemRefs.current[index] = element;
    },
    [],
  );

  return {
    isOpen: activeMenuId !== null && anchorRect !== null,
    activeMenuId,
    position,
    menuRef,
    openMenu,
    closeMenu,
    handleKeyDown,
    registerItem,
  };
}