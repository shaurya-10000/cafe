import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { RadioItemProps } from "../hooks/useRadioGroup";
import type { PaletteOption } from "../types";
import { OptionCard } from "./OptionCard";

interface PaletteCardProps {
  readonly palette: PaletteOption;
  readonly isActive: boolean;
  readonly itemProps: RadioItemProps;
  readonly reducedMotion: boolean;
}

export function PaletteCard({
  palette,
  isActive,
  itemProps,
  reducedMotion,
}: PaletteCardProps) {
  return (
    <OptionCard
      itemProps={itemProps}
      isActive={isActive}
      className="justify-between"
    >
      <div className="mb-6 flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 shadow-md"
            style={{ backgroundColor: palette.accent }}
            aria-hidden="true"
          >
            {isActive && (
              <Check size={16} className="text-white" strokeWidth={3.5} />
            )}
          </div>

          <div
            className="flex items-center gap-1.5 rounded-xl bg-zinc-200/50 p-1.5 dark:bg-zinc-800/60"
            aria-hidden="true"
          >
            <span
              className="h-3.5 w-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: palette.bgLight }}
              title="Light Background"
            />
            <span
              className="h-3.5 w-3.5 rounded-full border border-white/20"
              style={{ backgroundColor: palette.bgDark }}
              title="Dark Background"
            />
          </div>
        </div>

        {isActive && (
          <motion.span
            initial={reducedMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="rounded-full border border-cafe-accent/20 bg-cafe-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cafe-accent"
          >
            Active
          </motion.span>
        )}
      </div>

      <div className="space-y-1">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          {palette.name}
        </span>
        <p className="text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          {palette.description}
        </p>
      </div>
    </OptionCard>
  );
}
