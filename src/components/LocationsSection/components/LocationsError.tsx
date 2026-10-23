import { AlertCircle, RefreshCw } from "lucide-react";
import { FOCUS_RING_CLASSES, PILL_BUTTON_CLASSES } from "../styles";
import { cx } from "../lib/cx";
import type { LoadErrorKind } from "../types";

const MESSAGES: Record<LoadErrorKind, string> = {
  permission: "Locations aren't available right now. Please check back soon.",
  network: "Unable to load locations. Please try again.",
};

interface LocationsErrorProps {
  kind: LoadErrorKind;
  onRetry: () => void;
}

export function LocationsError({ kind, onRetry }: LocationsErrorProps) {
  return (
    <section
      data-testid="locations-section"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-6 py-24 text-center"
    >
      <div className="inline-flex flex-col items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
        <div className="inline-flex items-center gap-2">
          <AlertCircle size={16} aria-hidden="true" />
          <p>{MESSAGES[kind]}</p>
        </div>

        {kind !== "permission" && (
          <button
            type="button"
            onClick={onRetry}
            className={cx(
              "inline-flex items-center gap-2 px-5 py-2.5",
              PILL_BUTTON_CLASSES,
              FOCUS_RING_CLASSES,
            )}
          >
            <RefreshCw size={14} aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
