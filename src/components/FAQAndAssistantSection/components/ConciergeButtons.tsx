import { ArrowUpRight, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "../styles";

interface ConciergeButtonProps {
  readonly isOpen: boolean;
  readonly onOpen: () => void;
}

const ARROW_CLASSES = cn(
  "transition-transform duration-300",
  "group-hover:translate-x-0.5",
  "group-hover:-translate-y-0.5",
  "motion-reduce:transition-none",
);

/** Outlined pill in the section header. */
export function ConciergePillButton({ isOpen, onOpen }: ConciergeButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={cn(
        "group inline-flex items-center gap-2",
        "rounded-full border border-cafe-accent/30",
        "bg-cafe-accent/5 px-4 py-2",
        "text-[10px] font-black uppercase tracking-[0.2em]",
        "text-cafe-accent",
        "transition-all duration-200",
        "hover:border-cafe-accent",
        "hover:bg-cafe-accent",
        "hover:text-cafe-accent-fg",
        "motion-reduce:transition-none",
        FOCUS_RING,
      )}
    >
      <MessageCircle size={14} aria-hidden="true" />
      Ask the concierge
      <ArrowUpRight size={14} aria-hidden="true" className={ARROW_CLASSES} />
    </button>
  );
}

/** Text link in the desktop sidebar. */
export function ConciergeLinkButton({ isOpen, onOpen }: ConciergeButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      className={cn(
        "group inline-flex items-center gap-2",
        "text-[11px] font-black uppercase tracking-[0.2em]",
        "text-cafe-accent",
        "transition-colors duration-200",
        "hover:text-cafe-accent/70",
        "motion-reduce:transition-none",
        FOCUS_RING,
      )}
    >
      <Sparkles size={14} aria-hidden="true" />
      Open concierge
      <ArrowUpRight size={14} aria-hidden="true" className={ARROW_CLASSES} />
    </button>
  );
}

/** Filled call-to-action shown below lg, where the sidebar is hidden. */
export function ConciergeFloatingButton({
  isOpen,
  onOpen,
}: ConciergeButtonProps) {
  return (
    <div className="mt-16 flex justify-center lg:hidden">
      <button
        type="button"
        onClick={onOpen}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(
          "group flex items-center gap-3",
          "rounded-full bg-cafe-accent px-7 py-4",
          "text-xs font-black uppercase tracking-[0.2em]",
          "text-cafe-accent-fg",
          "shadow-lg shadow-cafe-accent/25",
          "transition-all duration-200",
          "hover:scale-[1.03]",
          "active:scale-[0.98]",
          "motion-reduce:transition-none",
          "motion-reduce:hover:scale-100",
          "motion-reduce:active:scale-100",
          FOCUS_RING,
        )}
      >
        <Sparkles
          size={16}
          aria-hidden="true"
          className={cn(
            "transition-transform duration-500",
            "group-hover:rotate-12",
            "motion-reduce:transition-none",
          )}
        />
        Ask the Concierge
      </button>
    </div>
  );
}
