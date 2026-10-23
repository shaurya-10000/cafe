import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import { ACTION_ICON } from "@/lib/ai/actions";
import { FOCUS_RING } from "@/components/ai/styles";
import { cn } from "@/lib/utils";
import type { ActionPayload } from "@/types/action";

interface ActionCardProps {
  action: ActionPayload;
  accentGradientClassName: string;
  onExecute: () => void;
}

/** The "Proceed" card shown under an assistant message that proposes an action. */
export function ActionCard({
  action,
  accentGradientClassName,
  onExecute,
}: ActionCardProps) {
  const ActionIcon = ACTION_ICON[action.type] ?? ArrowRight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between gap-3",
        "rounded-2xl border border-cafe-accent/30 bg-cafe-accent/10 p-3 shadow-sm",
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-cafe-fg">
        <ActionIcon
          size={14}
          className="shrink-0 text-cafe-accent"
          aria-hidden="true"
        />
        <span className="truncate">{action.label}</span>
      </div>

      <button
        type="button"
        onClick={onExecute}
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5",
          "rounded-xl px-3 py-1.5",
          accentGradientClassName,
          "text-[10px] font-black uppercase tracking-widest text-white",
          "shadow-md transition hover:scale-[1.02]",
          "motion-reduce:transition-none motion-reduce:hover:scale-100",
          FOCUS_RING,
        )}
      >
        <span>Proceed</span>
        <ArrowRight size={12} aria-hidden="true" />
      </button>
    </motion.div>
  );
}