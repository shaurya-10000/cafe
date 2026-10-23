import type { Particle } from "../types";

export function createParticles(
  count: number,
  iconCount: number,
  driftDirection: number,
  startId = 0,
): Particle[] {
  if (
    !Number.isFinite(count) ||
    !Number.isFinite(iconCount) ||
    count <= 0 ||
    iconCount <= 0
  ) {
    return [];
  }

  const safeCount = Math.floor(count);
  const safeIconCount = Math.floor(iconCount);

  if (safeCount <= 0 || safeIconCount <= 0) {
    return [];
  }

  return Array.from({ length: safeCount }, (_, index): Particle => {
    const driftMagnitude = Math.random() * 8 + 7;

    const drift =
      driftDirection === 0
        ? 0
        : driftMagnitude * (driftDirection < 0 ? -1 : 1);

    return {
      id: startId + index,
      x: Math.random() * 110 - 5,
      y: Math.random() * 110 - 5,
      size: Math.random() * 12 + 14,
      duration: Math.random() * 5 + 6,
      delay: Math.random() * 6,
      rotation: Math.random() * 360,
      iconIndex: Math.floor(Math.random() * safeIconCount),
      drift,
    };
  });
}