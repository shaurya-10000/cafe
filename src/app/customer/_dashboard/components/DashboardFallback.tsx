import { Loader2 } from "lucide-react";

import { FALLBACK_CLASS } from "../styles";

/** Suspense fallback while `useSearchParams` resolves. */
export function DashboardFallback() {
  return (
    <div className={FALLBACK_CLASS}>
      <Loader2
        className="animate-spin text-cafe-accent"
        size={32}
        aria-hidden="true"
      />
      <span className="sr-only">Loading dashboard…</span>
    </div>
  );
}