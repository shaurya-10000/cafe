import type { CSSProperties } from "react";

import { joinClasses } from "./lib/joinClasses";
import type { Particle, ParticleCssVars } from "./types";

const LAYER_BASE =
  "pointer-events-none fixed inset-0 select-none overflow-hidden";
const LAYER_FADE = "transition-opacity duration-700 ease-out";

const PARTICLE_BASE = "seasonal-bg-particle absolute";

const REDUCED_MOTION_OPACITY = 0.28;

export function buildLayerClassName(options: {
  zIndexClassName: string;
  visible: boolean;
  className: string;
}): string {
  return joinClasses(
    LAYER_BASE,
    options.zIndexClassName,
    LAYER_FADE,
    options.visible ? "opacity-100" : "opacity-0",
    options.className,
  );
}

export function buildStaticParticleClassName(color: string): string {
  return joinClasses(PARTICLE_BASE, color);
}

export function buildMotionParticleClassName(color: string): string {
  return joinClasses(PARTICLE_BASE, "transform-gpu will-change-transform", color);
}

export function buildCssParticleClassName(color: string): string {
  return joinClasses(PARTICLE_BASE, "transform-gpu", color);
}

/** Positioned, glow-backed, centered box shared by the Framer Motion variants. */
export function buildGlowParticleStyle(
  particle: Particle,
  glow: string,
): CSSProperties {
  const diameter = particle.size * 2.2;

  return {
    left: `${particle.x}vw`,
    top: `${particle.y}vh`,
    width: diameter,
    height: diameter,
    marginLeft: -diameter / 2,
    marginTop: -diameter / 2,
    background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

export function buildReducedMotionStyle(
  particle: Particle,
  glow: string,
  documentVisible: boolean,
): CSSProperties {
  return {
    ...buildGlowParticleStyle(particle, glow),
    opacity: documentVisible ? REDUCED_MOTION_OPACITY : 0,
    transform: `rotate(${particle.rotation}deg)`,
  };
}

export function buildCssParticleStyle(
  particle: Particle,
  reduceMotion: boolean,
  documentVisible: boolean,
): ParticleCssVars {
  const frozen = reduceMotion || !documentVisible;

  return {
    left: `${particle.x}vw`,
    top: `${particle.y}vh`,
    "--sb-rot": `${particle.rotation}deg`,
    "--sb-drift": `${particle.drift}vh`,
    animation: frozen
      ? "none"
      : `seasonal-bg-drift ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
    opacity: frozen
      ? documentVisible
        ? REDUCED_MOTION_OPACITY
        : 0
      : undefined,
    transform:
      reduceMotion && documentVisible
        ? `rotate(${particle.rotation}deg)`
        : undefined,
  };
}