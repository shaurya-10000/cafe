"use client";

import { useEffect, useState } from "react";

import { createParticles } from "../lib/particles";
import type { Particle, Season, SeasonConfig } from "../types";

interface ParticleState {
  season: Season;
  nextId: number;
  particles: Particle[];
}

interface UseParticlesOptions {
  enabled: boolean;
  season: Season;
  effectiveCount: number;
  config: SeasonConfig;
}

/**
 * Maintains the particle list. A season change regenerates everything; a
 * count change only trims or appends so existing particles keep animating.
 *
 * State updaters are pure: season/id bookkeeping lives in state rather than
 * in refs mutated inside the updater, so React Strict Mode's double
 * invocation cannot desynchronize it.
 */
export function useParticles({
  enabled,
  season,
  effectiveCount,
  config,
}: UseParticlesOptions): Particle[] | null {
  const [state, setState] = useState<ParticleState | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Particle generation is intentionally random, so it has to run in an
    // effect: during render it would be impure and would break hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((previous) => {
      if (previous === null || previous.season !== season) {
        return {
          season,
          nextId: effectiveCount,
          particles: createParticles(
            effectiveCount,
            config.icons.length,
            config.driftDirection,
            0,
          ),
        };
      }

      const { particles } = previous;

      if (effectiveCount === particles.length) {
        return previous;
      }

      if (effectiveCount < particles.length) {
        return { ...previous, particles: particles.slice(0, effectiveCount) };
      }

      const additional = createParticles(
        effectiveCount - particles.length,
        config.icons.length,
        config.driftDirection,
        previous.nextId,
      );

      return {
        season,
        nextId: previous.nextId + additional.length,
        particles: [...particles, ...additional],
      };
    });
  }, [enabled, season, effectiveCount, config.icons, config.driftDirection]);

  return state?.particles ?? null;
}