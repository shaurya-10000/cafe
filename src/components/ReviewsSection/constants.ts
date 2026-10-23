export const SECTION_ID = "testimonials-section";

export const DEFAULT_AUTO_SCROLL_SPEED = 35;
export const MAX_AUTO_SCROLL_SPEED = 500;

/** Must match the Tailwind `gap-6` / `pr-6` used between and after cards. */
export const CARD_GAP_PX = 24;

/** Caps a single frame step so a backgrounded tab cannot cause a big jump. */
export const MAX_FRAME_DELTA_MS = 100;

export const STAR_COUNT = 5;

export const REDUCED_MOTION_TRANSITION = { duration: 0 } as const;

export const FULL_MOTION_CONTAINER_TRANSITION = {
  staggerChildren: 0.1,
  delayChildren: 0.1,
} as const;

export const FULL_MOTION_ITEM_TRANSITION = {
  type: "spring",
  stiffness: 80,
  damping: 15,
} as const;
