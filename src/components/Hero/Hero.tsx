"use client";

import { memo } from "react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

import {
  HeroActions,
  HeroBackground,
  HeroEyebrow,
  HeroHeading,
  HeroSubtitle,
  HeroVersionStamp,
} from "./components";
import {
  DEFAULT_EYEBROW,
  DEFAULT_HEADING,
  DEFAULT_SUBTITLE,
  DEFAULT_VERSION_STAMP,
  HEADING_ID,
} from "./constants";
import { useHeroMotion } from "./hooks";
import { BOTTOM_FADE, CONTENT, CONTENT_STACK, SECTION } from "./styles";
import type { HeroProps } from "./types";

const Hero = memo(function Hero({
  scrollToMenu,
  scrollToLocation,
  onOpenAi,
  heading = DEFAULT_HEADING,
  eyebrow = DEFAULT_EYEBROW,
  subtitle = DEFAULT_SUBTITLE,
  versionStamp = DEFAULT_VERSION_STAMP,
  className,
}: HeroProps) {
  const motionConfig = useHeroMotion();

  return (
    <section aria-labelledby={HEADING_ID} className={cn(SECTION, className)}>
      <HeroBackground variants={motionConfig.backgroundVariants} />

      <div className={CONTENT}>
        <motion.div
          variants={motionConfig.containerVariants}
          initial="initial"
          animate="animate"
          className={CONTENT_STACK}
        >
          <HeroEyebrow variants={motionConfig.itemVariants} text={eyebrow} />
          <HeroHeading variants={motionConfig.itemVariants} text={heading} />
          <HeroSubtitle variants={motionConfig.itemVariants} text={subtitle} />
          <HeroActions
            variants={motionConfig.itemVariants}
            onExploreMenu={scrollToMenu}
            onFindUs={scrollToLocation}
            onOpenAi={onOpenAi}
          />
        </motion.div>
      </div>

      <HeroVersionStamp
        variants={motionConfig.stampVariants}
        text={versionStamp}
      />

      {/* Fades the hero into the next section. */}
      <div aria-hidden="true" className={BOTTOM_FADE} />
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;