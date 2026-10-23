import { FOCUSABLE_SELECTOR } from "../constants";

function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/** Moves focus to the first focusable child, or the dialog itself. */
export function focusFirst(root: HTMLElement | null): void {
  if (!root) return;
  (getFocusable(root)[0] ?? root).focus();
}

/** Cycles Tab / Shift+Tab inside `root`. */
export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  const focusable = getFocusable(root);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}