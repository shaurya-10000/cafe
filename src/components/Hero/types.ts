import type { Variants } from "framer-motion";

export interface HeroProps {
  /**
   * Scrolls the page to the menu section. Provided by the parent because
   * the hero doesn't own the section IDs (they may change per route).
   */
  readonly scrollToMenu: () => void;

  /** Scrolls the page to the location section. */
  readonly scrollToLocation: () => void;

  /**
   * Optional - when omitted, the "Ask Cafe AI" button is not rendered at
   * all. A fully-styled button that silently does nothing on click is
   * worse than no button: the user assumes the feature is broken rather
   * than absent.
   */
  readonly onOpenAi?: () => void;

  /** Optional heading override. Defaults to the current brand wordmark. */
  readonly heading?: string;

  /** Optional eyebrow label shown above the heading. */
  readonly eyebrow?: string;

  /** Optional subtitle. When omitted, the default quote is used. */
  readonly subtitle?: string;

  /** Optional decorative version stamp. Hidden from assistive tech. */
  readonly versionStamp?: string;

  readonly className?: string;
}

export type HeroButtonVariant = "primary" | "accent" | "secondary";

export interface HeroMotionConfig {
  readonly containerVariants: Variants;
  readonly itemVariants: Variants;
  readonly backgroundVariants: Variants;
  readonly stampVariants: Variants;
}