const NATIVE_FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;

function isFocusable(element: HTMLElement): boolean {
  return element.tabIndex >= 0 || NATIVE_FOCUSABLE.test(element.tagName);
}

/** Dev-only: `.focus()` on a non-focusable element is a silent no-op. */
export function warnIfNotFocusable(element: HTMLElement): void {
  if (process.env.NODE_ENV === "production") return;
  if (typeof element.focus !== "function") return;
  if (isFocusable(element)) return;

  console.warn(
    "[CartFAB] returnFocusRef points at a non-focusable element; " +
      "add tabIndex={-1} or point at a native control.",
  );
}