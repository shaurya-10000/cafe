"use client";

import type {
  Particle,
  ResolvedPerformanceMode,
  SeasonConfig,
} from "../types";
import { ParticleCss } from "./ParticleCss";
import { ParticleMotion } from "./ParticleMotion";

interface ParticleFieldProps {
  particles: readonly Particle[];
  config: SeasonConfig;
  mode: ResolvedPerformanceMode;
  reduceMotion: boolean;
  documentVisible: boolean;
}

export function ParticleField({
  particles,
  config,
  mode,
  reduceMotion,
  documentVisible,
}: ParticleFieldProps) {
  return (
    <>
      {particles.map((particle) => {
        const Icon = config.icons[particle.iconIndex];

        if (!Icon) {
          return null;
        }

        if (mode === "low") {
          return (
            <ParticleCss
              key={particle.id}
              particle={particle}
              Icon={Icon}
              color={config.color}
              reduceMotion={reduceMotion}
              documentVisible={documentVisible}
            />
          );
        }

        return (
          <ParticleMotion
            key={particle.id}
            particle={particle}
            Icon={Icon}
            color={config.color}
            glow={config.glow}
            reduceMotion={reduceMotion}
            documentVisible={documentVisible}
          />
        );
      })}
    </>
  );
}