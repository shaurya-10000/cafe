import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCollapseMotion } from "../lib/motion";
import { ALL_TYPES, TYPE_LABEL } from "../notificationTypes";

interface PreferencesPanelProps {
  readonly open: boolean;
  readonly mutedTypes: readonly string[];
  readonly onToggleType: (type: string) => void;
  readonly reducedMotion: boolean;
}

export function PreferencesPanel({
  open,
  mutedTypes,
  onToggleType,
  reducedMotion,
}: PreferencesPanelProps) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          {...getCollapseMotion(reducedMotion)}
          className="overflow-hidden border-b border-zinc-100 dark:border-white/5"
        >
          <div className="space-y-1 p-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Notify me about
            </p>

            {ALL_TYPES.map((type) => {
              const isOn = !mutedTypes.includes(type);

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onToggleType(type)}
                  aria-pressed={isOn}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:hover:bg-white/5"
                >
                  <span className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300">
                    {TYPE_LABEL[type]}
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors",
                      isOn
                        ? "border-cafe-accent bg-cafe-accent text-white"
                        : "border-zinc-300 dark:border-zinc-700",
                    )}
                  >
                    {isOn && <Check size={12} strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
