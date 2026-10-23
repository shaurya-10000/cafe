import { useId } from "react";
import { Palette } from "lucide-react";
import { COLOR_PALETTES, PALETTE_IDS } from "../data/palettes";
import { useRadioGroup } from "../hooks/useRadioGroup";
import type { ColorPalette } from "../types";
import { PaletteCard } from "./PaletteCard";

interface PaletteSectionProps {
  /** Whatever the provider reports; narrowed to a known palette below. */
  readonly palette: string | undefined;
  readonly onChange: (palette: ColorPalette) => void;
  readonly reducedMotion: boolean;
}

export function PaletteSection({
  palette,
  onChange,
  reducedMotion,
}: PaletteSectionProps) {
  const legendId = useId();

  const selected = PALETTE_IDS.find((id) => id === palette);

  const { groupProps, getItemProps } = useRadioGroup<ColorPalette>(
    PALETTE_IDS,
    selected,
    onChange,
  );

  return (
    <fieldset className="space-y-4 border-t border-zinc-200 pt-4 dark:border-white/5">
      <legend
        id={legendId}
        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
      >
        <Palette size={16} className="text-cafe-accent" aria-hidden="true" />
        Luxury Color Palettes
      </legend>

      <div
        {...groupProps}
        aria-labelledby={legendId}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {COLOR_PALETTES.map((option) => (
          <PaletteCard
            key={option.id}
            palette={option}
            isActive={option.id === selected}
            itemProps={getItemProps(option.id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </fieldset>
  );
}
