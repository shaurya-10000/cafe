"use client";

import { memo } from "react";
import { motion } from "framer-motion";

import {
  buildGlowParticleStyle,
  buildMotionParticleClassName,
  buildReducedMotionStyle,
  buildStaticParticleClassName,
} from "../styles";
import type { ParticleMotionProps } from "../types";

/** Framer Motion particle. Used when performance mode resolves to "high". */
export const ParticleMotion = memo(function ParticleMotion({
  particle,
  Icon,
  color,
  glow,
  reduceMotion,
  documentVisible,
}: ParticleMotionProps) {
  if (reduceMotion) {
    return (
      <div
        className={buildStaticParticleClassName(color)}
        style={buildReducedMotionStyle(particle, glow, documentVisible)}
      >
        <Icon size={particle.size} />
      </div>
    );
  }

  const animate = documentVisible
    ? {
        opacity: [0, 0.7, 0],
        scale: [0.8, 1.15, 0.8],
        y: [0, `${particle.drift}vh`],
        rotate: [particle.rotation, particle.rotation + 25],
      }
    : {
        opacity: 0,
      };

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.8,
        y: 0,
        rotate: particle.rotation,
      }}
      animate={animate}
      transition={
        documentVisible
          ? {
              duration: particle.duration,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
              delay: particle.delay,
            }
          : {
              duration: 0,
            }
      }
      className={buildMotionParticleClassName(color)}
      style={buildGlowParticleStyle(particle, glow)}
    >
      <Icon size={particle.size} />
    </motion.div>
  );
});