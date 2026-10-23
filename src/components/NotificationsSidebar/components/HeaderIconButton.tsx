import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeaderIconButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly active?: boolean;
  readonly pressed?: boolean;
  readonly expanded?: boolean;
  readonly disabled?: boolean;
  readonly children: ReactNode;
}

export function HeaderIconButton({
  label,
  onClick,
  active = false,
  pressed,
  expanded,
  disabled,
  children,
}: HeaderIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      title={label}
      className={cn(
        "rounded-2xl p-3 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent",
        "disabled:opacity-50",
        active
          ? "bg-cafe-accent/10 text-cafe-accent"
          : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5",
      )}
    >
      {children}
    </button>
  );
}
