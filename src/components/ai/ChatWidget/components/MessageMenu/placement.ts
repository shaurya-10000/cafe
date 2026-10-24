import {
  EDGE_GAP_PX,
  ITEM_HEIGHT_PX,
  MENU_PADDING_PX,
  MENU_WIDTH_PX,
  SCROLL_CONTAINER_SELECTOR,
} from "./constants";
import type { MenuPlacement } from "./types";

type Bounds = Pick<DOMRect, "top" | "bottom" | "left" | "right">;

/**
 * Picks where the menu opens so it stays inside the message list's scroll
 * area. The list clips overflow, so a menu that ran past an edge would be
 * cut off. Prefers opening down and to the right.
 */
export function computePlacement(
  trigger: HTMLElement,
  itemCount: number,
): MenuPlacement {
  const triggerRect = trigger.getBoundingClientRect();
  const container = trigger.closest<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
  const bounds: Bounds = container?.getBoundingClientRect() ?? {
    top: 0,
    bottom: window.innerHeight,
    left: 0,
    right: window.innerWidth,
  };

  const menuHeight = itemCount * ITEM_HEIGHT_PX + MENU_PADDING_PX;
  const spaceBelow = bounds.bottom - triggerRect.bottom - EDGE_GAP_PX;
  const spaceAbove = triggerRect.top - bounds.top - EDGE_GAP_PX;
  const vertical =
    spaceBelow >= menuHeight || spaceBelow >= spaceAbove ? "down" : "up";

  const fitsRight =
    triggerRect.left + MENU_WIDTH_PX <= bounds.right - EDGE_GAP_PX;
  const fitsLeft =
    triggerRect.right - MENU_WIDTH_PX >= bounds.left + EDGE_GAP_PX;
  const horizontal = fitsRight || !fitsLeft ? "start" : "end";

  return { vertical, horizontal };
}
