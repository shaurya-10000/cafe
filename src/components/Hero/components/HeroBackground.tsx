"use client";

import { memo } from "react";

import Image from "next/image";

import { motion, type Variants } from "framer-motion";

import { HERO_BACKGROUND_IMAGE } from "../constants";
import {
  BACKGROUND,
  BACKGROUND_FADE,
  BACKGROUND_IMAGE,
  BACKGROUND_WASH,
} from "../styles";

interface HeroBackgroundProps {
  readonly variants: Variants;
}

/**
 * Cinematic background. `prefers-reduced-motion` collapses the entrance to
 * a plain fade. The image is self-hosted and marked `priority` because it
 * is very likely the LCP element. `aria-hidden` so assistive tech skips
 * straight to the content.
 */
export const HeroBackground = memo(function HeroBackground({
  variants,
}: HeroBackgroundProps) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      aria-hidden="true"
      className={BACKGROUND}
    >
      <Image
        src={HERO_BACKGROUND_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className={BACKGROUND_IMAGE}
      />

      {/* Tonal wash - keeps AA contrast for the text regardless of the photo. */}
      <div className={BACKGROUND_WASH} />

      {/* Bottom fade into the page background. */}
      <div className={BACKGROUND_FADE} />
    </motion.div>
  );
});