/**
 * Self-hosted background image. Place the asset at:
 *
 *   public/images/hero-background.webp
 */
export const HERO_BACKGROUND_IMAGE = "/images/hero-background.webp";

export const HEADING_ID = "hero-heading";

export const DEFAULT_HEADING = "CAFE";
export const DEFAULT_EYEBROW = "Specialty Grade \u2022 2026";
export const DEFAULT_SUBTITLE =
  "A sensory experience architected around the purity of the bean.";
export const DEFAULT_VERSION_STAMP = "v.2026 / Platform";

export const EASE_CINEMATIC = [0.16, 1, 0.3, 1] as const;

export const HOVER_LIFT = { y: -4, scale: 1.02 } as const;
export const HOVER_GHOST = {
  y: -4,
  backgroundColor: "rgba(161, 161, 170, 0.1)",
} as const;
export const TAP_PRESS = { scale: 0.98 } as const;

export const AI_BUTTON_ICON = "\u2726";