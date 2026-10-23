import { MENU_GAP_PX, MENU_VIEWPORT_PADDING_PX } from "../constants";
import type { MenuPosition } from "../types";

interface Size {
  width: number;
  height: number;
}

/**
 * Places a menu under its anchor, clamped horizontally to the viewport and
 * flipped above the anchor when there is no room below.
 */
export function computeMenuPosition(
  anchor: DOMRect,
  menu: Size,
  viewport: Size,
): MenuPosition {
  const gap = MENU_GAP_PX;
  const pad = MENU_VIEWPORT_PADDING_PX;

  const maxLeft = Math.max(pad, viewport.width - menu.width - pad);
  const left = Math.min(Math.max(anchor.left, pad), maxLeft);

  const spaceBelow = viewport.height - anchor.bottom - gap;
  const shouldFlip =
    spaceBelow < menu.height && anchor.top - gap - menu.height >= pad;

  const top = shouldFlip
    ? anchor.top - menu.height - gap
    : Math.min(
        anchor.bottom + gap,
        Math.max(pad, viewport.height - menu.height - pad),
      );

  return { left, top };
}