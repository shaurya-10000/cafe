import { FOCUSABLE_SELECTOR } from "../constants";

/** Cycles Tab / Shift+Tab inside `root`. */
export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  const focusables = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

  if (focusables.length === 0) {
    event.preventDefault();
    root.focus();
    return;
  }

  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  const active = document.activeElement;

  if (event.shiftKey && (active === first || active === root)) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first?.focus();
  }
}