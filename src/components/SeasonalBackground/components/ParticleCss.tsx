"use client";

import { memo } from "react";

import {
  buildCssParticleClassName,
  buildCssParticleStyle,
} from "../styles";
import type { ParticleViewProps } from "../types";

/** CSS-keyframe particle. Used when performance mode resolves to "low". */
export const ParticleCss = memo(function ParticleCss({
  particle,
  Icon,
  color,
  reduceMotion,
  documentVisible,
}: ParticleViewProps) {
  return (
    <div
      className={buildCssParticleClassName(color)}
      style={buildCssParticleStyle(particle, reduceMotion, documentVisible)}
    >
      <Icon size={particle.size} />
    </div>
  );
});