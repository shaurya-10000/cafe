import { memo, useCallback } from "react";
import type { KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAnswerMotion, getRowMotion } from "../lib/motion";
import { FOCUS_RING } from "../styles";
import type { FAQEntry, RowNavKey } from "../types";

interface FaqRowProps {
  readonly entry: FAQEntry;
  readonly isOpen: boolean;
  readonly reducedMotion: boolean;
  readonly buttonId: string;
  readonly panelId: string;
  readonly onToggle: (id: string) => void;
  readonly onKeyNav: (id: string, key: RowNavKey) => void;
  readonly registerButton: (id: string, node: HTMLButtonElement | null) => void;
}

const NAV_KEYS: ReadonlySet<string> = new Set([
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

export const FaqRow = memo(function FaqRow({
  entry,
  isOpen,
  reducedMotion,
  buttonId,
  panelId,
  onToggle,
  onKeyNav,
  registerButton,
}: FaqRowProps) {
  const handleClick = useCallback(() => {
    onToggle(entry.id);
  }, [entry.id, onToggle]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (!NAV_KEYS.has(event.key)) return;
      event.preventDefault();
      onKeyNav(entry.id, event.key as RowNavKey);
    },
    [entry.id, onKeyNav],
  );

  const setButtonRef = useCallback(
    (node: HTMLButtonElement | null) => registerButton(entry.id, node),
    [entry.id, registerButton],
  );

  return (
    <motion.li
      layout={!reducedMotion}
      {...getRowMotion(reducedMotion)}
      className="group/row relative border-b border-cafe-border last:border-b-0"
    >
      <h3 className="m-0">
        <button
          ref={setButtonRef}
          id={buttonId}
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative flex w-full items-center justify-between",
            "gap-6 py-6 text-left",
            "transition-colors duration-300",
            "motion-reduce:transition-none",
            FOCUS_RING,
          )}
        >
          <span className="flex-1">
            <span
              className={cn(
                "block text-lg font-black uppercase",
                "leading-tight tracking-tight",
                "transition-colors duration-300",
                "motion-reduce:transition-none",
                "md:text-xl",
                isOpen
                  ? "text-cafe-accent"
                  : "text-cafe-fg group-hover/row:text-cafe-accent",
              )}
            >
              {entry.q}
            </span>
          </span>

          <span
            aria-hidden="true"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center",
              "rounded-full border",
              "transition-all duration-300",
              "motion-reduce:transition-none",
              isOpen
                ? "rotate-180 border-cafe-accent bg-cafe-accent text-cafe-accent-fg"
                : "border-cafe-border bg-transparent text-cafe-fg/60 group-hover/row:border-cafe-accent group-hover/row:text-cafe-accent",
            )}
          >
            <ChevronDown size={18} strokeWidth={2.5} />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={panelId}
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            {...getAnswerMotion(reducedMotion)}
            className="overflow-hidden"
          >
            <div className="pb-8 pr-14">
              <p className="max-w-2xl text-base font-medium leading-relaxed text-cafe-fg/70">
                {entry.a}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
});
