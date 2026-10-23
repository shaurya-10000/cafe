import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { RadioItemProps } from "../hooks/useRadioGroup";

interface OptionCardProps {
  readonly itemProps: RadioItemProps;
  readonly isActive: boolean;
  /** Layout differences between card kinds (alignment). */
  readonly className?: string;
  readonly children: ReactNode;
}

/** Shared radio-card shell for the mode and palette pickers. */
export function OptionCard({
  itemProps,
  isActive,
  className,
  children,
}: OptionCardProps) {
  return (
    <button
      type="button"
      {...itemProps}
      className={cn(
        "group relative flex flex-col rounded-[2.5rem] border p-6 text-left transition-all duration-300",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
        isActive
          ? "border-cafe-accent bg-white shadow-xl shadow-cafe-accent/5 dark:bg-zinc-900"
          : "border-zinc-200 bg-[#F5F5F1] hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-900/40 dark:hover:border-white/10",
        className,
      )}
    >
      {children}

      {isActive && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[2.5rem] ring-2 ring-cafe-accent/20"
        />
      )}
    </button>
  );
}
