import { Sparkles } from "lucide-react";

/**
 * Honestly labelled status card rather than a toggle that does nothing. A real
 * "reduce motion" control needs an app-wide motion-preference provider (to
 * actually suppress framer-motion animations everywhere) that doesn't exist
 * yet; a disabled-looking switch would imply a working control it isn't.
 */
export function ReduceMotionNotice() {
  return (
    <div className="border-t border-zinc-200 pt-6 dark:border-white/5">
      <div className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white p-6 dark:border-white/5 dark:bg-zinc-900">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5">
            <Sparkles size={18} className="text-zinc-400" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Reduce Motion
            </p>
            <p className="text-[11px] font-medium text-zinc-500">
              Minimize animations across the dashboard &mdash; coming soon
            </p>
          </div>
        </div>

        <span
          className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:bg-white/5"
          aria-hidden="true"
        >
          Soon
        </span>
      </div>
    </div>
  );
}
