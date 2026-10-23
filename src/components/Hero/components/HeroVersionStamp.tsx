"use client";

import { memo } from "react";

import { motion, type Variants } from "framer-motion";

import { STAMP, STAMP_WRAPPER } from "../styles";

interface HeroVersionStampProps {
  readonly variants: Variants;
  readonly text: string;
}

/**
 * Purely atmospheric, hidden from assistive tech so it doesn't clutter
 * the accessibility tree.
 */
export const HeroVersionStamp = memo(function HeroVersionStamp({
  variants,
  text,
}: HeroVersionStampProps) {
  return (
    <div aria-hidden="true" className={STAMP_WRAPPER}>
      <motion.p
        variants={variants}
        initial="initial"
        animate="animate"
        className={STAMP}
      >
        {text}
      </motion.p>
    </div>
  );
});