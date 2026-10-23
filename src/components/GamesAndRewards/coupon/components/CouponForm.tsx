import type { KeyboardEvent } from "react";
import { Loader2, Tag } from "lucide-react";

interface CouponFormProps {
  readonly errorId: string;
  readonly code: string;
  readonly loading: boolean;
  readonly error: string | null;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => void;
}

export function CouponForm({
  errorId,
  code,
  loading,
  error,
  onChange,
  onSubmit,
}: CouponFormProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !loading) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={code}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter coupon code"
            disabled={loading}
            aria-label="Coupon code"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-xs font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-cafe-accent disabled:opacity-50 dark:border-white/5 dark:bg-zinc-900"
          />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || !code.trim()}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:bg-white dark:text-black"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
          ) : (
            "Apply"
          )}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-[10px] font-bold text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
