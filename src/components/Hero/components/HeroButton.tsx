"use client";

import { memo, type ReactNode } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

import { HOVER_GHOST, HOVER_LIFT, TAP_PRESS } from "../constants";
import {
  BUTTON_LABEL,
  BUTTON_SIZE,
  FOCUS_RING,
  SECONDARY_BUTTON,
  SLIDE_BUTTON_BASE,
  SLIDE_BUTTONS,
  SLIDE_FILL,
  SLIDE_OVERLAY_LABEL,
} from "../styles";
import type { HeroButtonVariant } from "../types";

interface HeroButtonProps {
  readonly variant: HeroButtonVariant;
  readonly onClick: () => void;
  readonly children: ReactNode;
  /** Decorative leading glyph. Hidden from assistive tech. */
  readonly icon?: ReactNode;
}

interface ButtonLabelProps {
  readonly icon?: ReactNode;
  readonly children: ReactNode;
}

function ButtonLabel({ icon, children }: ButtonLabelProps) {
  return (
    <span className="inline-flex items-center gap-2">
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}

export const HeroButton = memo(function HeroButton({
  variant,
  onClick,
  children,
  icon,
}: HeroButtonProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const whileTap = reducedMotion ? undefined : TAP_PRESS;

  if (variant === "secondary") {
    return (
      <motion.button
        type="button"
        whileHover={reducedMotion ? undefined : HOVER_GHOST}
        whileTap={whileTap}
        onClick={onClick}
        className={cn(BUTTON_SIZE, SECONDARY_BUTTON, FOCUS_RING)}
      >
        <span className={BUTTON_LABEL}>{children}</span>
      </motion.button>
    );
  }

  const style = SLIDE_BUTTONS[variant];

  return (
    <motion.button
      type="button"
      whileHover={reducedMotion ? undefined : HOVER_LIFT}
      whileTap={whileTap}
      onClick={onClick}
      className={cn(
        SLIDE_BUTTON_BASE,
        BUTTON_SIZE,
        style.root,
        FOCUS_RING,
      )}
    >
      <span className={cn("relative z-10", BUTTON_LABEL, style.label)}>
        <ButtonLabel icon={icon}>{children}</ButtonLabel>
      </span>

      <span
        aria-hidden="true"
        className={cn("absolute inset-0", style.fill, SLIDE_FILL)}
      />

      <span
        aria-hidden="true"
        className={cn(SLIDE_OVERLAY_LABEL, BUTTON_LABEL, style.overlayLabel)}
      >
        <ButtonLabel icon={icon}>{children}</ButtonLabel>
      </span>
    </motion.button>
  );
});