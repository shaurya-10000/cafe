import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FaqIds } from "../lib/ids";
import { getEmptyStateMotion, getListVariants } from "../lib/motion";
import type { FAQEntry, FAQFilter, RowNavKey } from "../types";
import { FaqRow } from "./FaqRow";

interface FaqListProps {
  readonly ids: FaqIds;
  readonly entries: readonly FAQEntry[];
  readonly activeFilter: FAQFilter;
  readonly openId: string | null;
  readonly reducedMotion: boolean;
  readonly onToggle: (id: string) => void;
  readonly onKeyNav: (id: string, key: RowNavKey) => void;
  readonly registerButton: (id: string, node: HTMLButtonElement | null) => void;
}

/** The tabpanel that the category tabs control. */
export function FaqList({
  ids,
  entries,
  activeFilter,
  openId,
  reducedMotion,
  onToggle,
  onKeyNav,
  registerButton,
}: FaqListProps) {
  const listVariants = useMemo(
    () => getListVariants(reducedMotion),
    [reducedMotion],
  );

  return (
    <div
      id={ids.panel}
      role="tabpanel"
      aria-labelledby={ids.tab(activeFilter)}
      tabIndex={0}
      className="min-w-0 outline-none"
    >
      {/* Keyed by filter so the whole list re-enters on every category change. */}
      <motion.ul
        key={activeFilter}
        variants={listVariants}
        initial="hidden"
        animate="visible"
        className="m-0 list-none p-0"
      >
        <AnimatePresence initial={false}>
          {entries.length === 0 ? (
            <motion.li
              key="empty"
              {...getEmptyStateMotion(reducedMotion)}
              className={cn(
                "py-12 text-center",
                "text-sm font-bold uppercase tracking-widest",
                "text-cafe-fg/50",
              )}
            >
              No questions in this category yet.
            </motion.li>
          ) : (
            entries.map((entry) => (
              <FaqRow
                key={entry.id}
                entry={entry}
                isOpen={openId === entry.id}
                reducedMotion={reducedMotion}
                buttonId={ids.rowButton(entry.id)}
                panelId={ids.rowPanel(entry.id)}
                onToggle={onToggle}
                onKeyNav={onKeyNav}
                registerButton={registerButton}
              />
            ))
          )}
        </AnimatePresence>
      </motion.ul>
    </div>
  );
}
