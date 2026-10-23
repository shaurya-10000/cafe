import { wrap } from "framer-motion";

/**
 * Wraps a track offset into `[-setWidth, 0)` so the duplicated set makes the
 * loop seamless. Non-finite input resets to 0.
 */
export function wrapPosition(value: number, setWidth: number): number {
  if (!Number.isFinite(value)) return 0;

  return wrap(-setWidth, 0, value);
}
