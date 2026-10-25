import { useId } from "react";
import { Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRadioGroup } from "../../ThemeSettings/hooks/useRadioGroup";

export interface ChoiceOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly description: string;
  readonly icon: LucideIcon;
}

interface ChoiceGroupProps<T extends string> {
  readonly legend: string;
  readonly options: readonly ChoiceOption<T>[];
  readonly values: readonly T[];
  readonly selected: T | undefined;
  readonly onChange: (value: T) => void;
  readonly disabled?: boolean;
}

export function ChoiceGroup<T extends string>({
  legend,
  options,
  values,
  selected,
  onChange,
  disabled = false,
}: ChoiceGroupProps<T>) {
  const legendId = useId();

  const { groupProps, getItemProps } = useRadioGroup<T>(
    values,
    selected,
    (value) => {
      if (!disabled) onChange(value);
    },
  );

  return (
    <fieldset className="space-y-3">
      <legend
        id={legendId}
        className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
      >
        {legend}
      </legend>

      <div
        {...groupProps}
        aria-labelledby={legendId}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {options.map((option) => {
          const Icon = option.icon;
          const isActive = option.value === selected;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              {...getItemProps(option.value)}
              className={cn(
                "flex items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-300",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isActive
                  ? "border-cafe-accent bg-white shadow-lg shadow-cafe-accent/5 dark:bg-zinc-900"
                  : "border-zinc-200 bg-[#F5F5F1] hover:border-zinc-300 dark:border-white/5 dark:bg-zinc-900/40 dark:hover:border-white/10",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-colors",
                  isActive
                    ? "bg-cafe-accent text-white"
                    : "bg-white text-zinc-500 dark:bg-zinc-800",
                )}
              >
                <Icon size={18} strokeWidth={2.5} aria-hidden="true" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {option.description}
                </span>
              </span>

              {isActive && (
                <Check
                  size={16}
                  strokeWidth={3.5}
                  aria-hidden="true"
                  className="shrink-0 text-cafe-accent"
                />
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
