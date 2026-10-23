import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RadioItemProps } from "../hooks/useRadioGroup";
import type { ModeOption } from "../types";
import { OptionCard } from "./OptionCard";

interface ModeCardProps {
  readonly option: ModeOption;
  readonly isActive: boolean;
  readonly itemProps: RadioItemProps;
  readonly reducedMotion: boolean;
}

export function ModeCard({
  option,
  isActive,
  itemProps,
  reducedMotion,
}: ModeCardProps) {
  const Icon = option.icon;

  return (
    <OptionCard itemProps={itemProps} isActive={isActive} className="items-start">
      <div className="mb-6 flex w-full items-center justify-between">
        <div
          className={cn(
            "rounded-2xl p-3 transition-colors duration-300",
            isActive
              ? "bg-cafe-accent text-white"
              : "bg-white text-zinc-500 group-hover:text-zinc-900 dark:bg-zinc-800 dark:group-hover:text-zinc-100",
          )}
        >
          <Icon size={22} strokeWidth={2.5} aria-hidden="true" />
        </div>

        {isActive && (
          <motion.div
            initial={reducedMotion ? false : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reducedMotion ? { duration: 0 } : undefined}
            className="rounded-full bg-cafe-accent p-1.5 shadow-lg shadow-cafe-accent/30"
            aria-hidden="true"
          >
            <Check size={14} className="text-white" strokeWidth={4} />
          </motion.div>
        )}
      </div>

      <div className="space-y-1">
        <span className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          {option.name}
        </span>
        <p className="text-xs font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
          {option.description}
        </p>
      </div>
    </OptionCard>
  );
}
