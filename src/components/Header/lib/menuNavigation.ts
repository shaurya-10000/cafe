import type { KeyboardEvent } from "react";

const NAVIGATION_KEYS = new Set(["ArrowDown", "ArrowUp", "Home", "End"]);

/**
 * Roving-focus keyboard handling for `role="menu"` containers.
 * Items must be marked with `data-menu-item="true"`.
 */
export function handleMenuKeyDown(event: KeyboardEvent<HTMLElement>): void {
  if (!NAVIGATION_KEYS.has(event.key)) return;

  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      '[data-menu-item="true"]',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-disabled") !== "true",
  );

  if (items.length === 0) return;

  event.preventDefault();

  const currentIndex = items.findIndex(
    (item) => item === document.activeElement,
  );

  let nextIndex = 0;

  switch (event.key) {
    case "Home":
      nextIndex = 0;
      break;

    case "End":
      nextIndex = items.length - 1;
      break;

    case "ArrowDown":
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      break;

    case "ArrowUp":
      nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
      break;

    default:
      return;
  }

  items[nextIndex]?.focus();
}
