import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatCount } from "../lib/categories";
import { FOCUS_RING } from "../styles";

interface FilterChipProps {
  readonly id: string;
  readonly panelId: string;
  readonly label: string;
  readonly count: number;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly buttonRef?: (node: HTMLButtonElement | null) => void;
}

export const FilterChip = memo(function FilterChip({
  id,
  panelId,
  label,
  count,
  active,
  onClick,
  buttonRef,
}: FilterChipProps) {
  // Roving tabindex: only the active chip is in the tab order; arrow keys
  // move between chips, as expected for a horizontal tablist.
  return (
    <button
      ref={buttonRef}
      id={id}
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={panelId}
      tabIndex={active ? 0 : -1}
      onClick={onClick}
      className={cn(
        "group inline-flex items-center gap-2",
        "rounded-full border px-4 py-2",
        "text-[10px] font-black uppercase tracking-[0.2em]",
        "transition-all duration-200",
        "motion-reduce:transition-none",
        FOCUS_RING,
        active
          ? "border-cafe-accent bg-cafe-accent text-cafe-accent-fg"
          : "border-cafe-border bg-transparent text-cafe-fg/70 hover:border-cafe-accent hover:text-cafe-accent",
      )}
    >
      <span>{label}</span>

      <span
        aria-hidden="true"
        className={cn(
          "rounded-full px-1.5 py-0.5",
          "text-[9px] tabular-nums",
          active
            ? "bg-cafe-accent-fg/20 text-cafe-accent-fg"
            : "bg-cafe-fg/10 text-cafe-fg/60",
        )}
      >
        {formatCount(count)}
      </span>
    </button>
  );
});
