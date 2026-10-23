import {
  CSS_KEYFRAMES_ID,
  SEASONAL_BACKGROUND_KEYFRAMES_CSS,
} from "../constants";

/** Idempotently injects the CSS-mode keyframes into <head>. */
export function ensureCssKeyframes(): void {
  if (
    typeof document === "undefined" ||
    !document.head ||
    document.getElementById(CSS_KEYFRAMES_ID)
  ) {
    return;
  }

  const style = document.createElement("style");
  style.id = CSS_KEYFRAMES_ID;
  style.textContent = SEASONAL_BACKGROUND_KEYFRAMES_CSS;

  document.head.appendChild(style);
}