import { useId } from "react";
import { MODE_OPTIONS, MODE_VALUES } from "../data/modes";
import { useRadioGroup } from "../hooks/useRadioGroup";
import type { ThemeMode } from "../types";
import { ModeCard } from "./ModeCard";

interface ModeSectionProps {
  /** Whatever the provider reports; narrowed to a known mode below. */
  readonly mode: string | undefined;
  readonly onChange: (mode: ThemeMode) => void;
  readonly reducedMotion: boolean;
}

export function ModeSection({ mode, onChange, reducedMotion }: ModeSectionProps) {
  const legendId = useId();

  // Unknown or missing values resolve to undefined, so the group falls back
  // to its first radio as the tab stop instead of crashing.
  const selected = MODE_VALUES.find((value) => value === mode);

  const { groupProps, getItemProps } = useRadioGroup<ThemeMode>(
    MODE_VALUES,
    selected,
    onChange,
  );

  return (
    <fieldset className="space-y-4">
      <legend
        id={legendId}
        className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
      >
        Appearance Mode
      </legend>

      <div
        {...groupProps}
        aria-labelledby={legendId}
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {MODE_OPTIONS.map((option) => (
          <ModeCard
            key={option.value}
            option={option}
            isActive={option.value === selected}
            itemProps={getItemProps(option.value)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </fieldset>
  );
}
