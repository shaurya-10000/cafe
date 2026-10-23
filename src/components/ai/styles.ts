import { cn } from "@/lib/utils";

/**
 * Focus ring shared by every interactive element in the AI chat UI. Hoisted
 * to module scope so the `cn()` merge is computed once, not on every render.
 */
export const FOCUS_RING = cn(
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-cafe-accent",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-cafe-bg",
);