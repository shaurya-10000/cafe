"use client";

import { memo } from "react";

import { motion, type Variants } from "framer-motion";

import { AI_BUTTON_ICON } from "../constants";
import { ACTIONS } from "../styles";

import { HeroButton } from "./HeroButton";

interface HeroActionsProps {
  readonly variants: Variants;
  readonly onExploreMenu: () => void;
  readonly onFindUs: () => void;
  /**
   * When omitted the AI button is not rendered at all; a styled button
   * that does nothing reads as broken rather than absent.
   */
  readonly onOpenAi?: () => void;
}

export const HeroActions = memo(function HeroActions({
  variants,
  onExploreMenu,
  onFindUs,
  onOpenAi,
}: HeroActionsProps) {
  return (
    <motion.div variants={variants} className={ACTIONS}>
      <HeroButton variant="primary" onClick={onExploreMenu}>
        Explore Menu
      </HeroButton>

      {onOpenAi ? (
        <HeroButton variant="accent" onClick={onOpenAi} icon={AI_BUTTON_ICON}>
          Ask Cafe AI
        </HeroButton>
      ) : null}

      <HeroButton variant="secondary" onClick={onFindUs}>
        Find Us
      </HeroButton>
    </motion.div>
  );
});