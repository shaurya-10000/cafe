"use client";

import { memo } from "react";

import { motion, type Variants } from "framer-motion";

import { HEADING_ID } from "../constants";
import { HEADING, HEADING_DOT } from "../styles";

interface HeroHeadingProps {
  readonly variants: Variants;
  readonly text: string;
}

export const HeroHeading = memo(function HeroHeading({
  variants,
  text,
}: HeroHeadingProps) {
  return (
    <motion.h1 id={HEADING_ID} variants={variants} className={HEADING}>
      {text}
      <span aria-hidden="true" className={HEADING_DOT}>
        .
      </span>
    </motion.h1>
  );
});