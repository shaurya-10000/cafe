"use client";

import { memo } from "react";

import { motion, type Variants } from "framer-motion";

import { EYEBROW, EYEBROW_RULE, EYEBROW_TEXT } from "../styles";

interface HeroEyebrowProps {
  readonly variants: Variants;
  readonly text: string;
}

export const HeroEyebrow = memo(function HeroEyebrow({
  variants,
  text,
}: HeroEyebrowProps) {
  return (
    <motion.div variants={variants} className={EYEBROW}>
      <span aria-hidden="true" className={EYEBROW_RULE} />
      <span className={EYEBROW_TEXT}>{text}</span>
      <span aria-hidden="true" className={EYEBROW_RULE} />
    </motion.div>
  );
});