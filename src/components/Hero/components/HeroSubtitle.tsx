"use client";

import { memo } from "react";

import { motion, type Variants } from "framer-motion";

import { SUBTITLE, SUBTITLE_RULE, SUBTITLE_TEXT } from "../styles";

interface HeroSubtitleProps {
  readonly variants: Variants;
  readonly text: string;
}

export const HeroSubtitle = memo(function HeroSubtitle({
  variants,
  text,
}: HeroSubtitleProps) {
  return (
    <motion.div variants={variants} className={SUBTITLE}>
      <p className={SUBTITLE_TEXT}>&ldquo;{text}&rdquo;</p>
      <span aria-hidden="true" className={SUBTITLE_RULE} />
    </motion.div>
  );
});