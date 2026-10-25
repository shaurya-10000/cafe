import { cn } from "@/lib/utils";

interface SwitchProps {
  readonly checked: boolean;
  readonly onChange: () => void;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent dark:hover:bg-white/5"
    >
      <span>
        <span className="block text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-cafe-accent" : "bg-zinc-300 dark:bg-zinc-700",
        )}
      >
        <span
          className={cn(
            "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}
