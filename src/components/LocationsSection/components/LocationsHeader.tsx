import { Loader2, LocateFixed } from "lucide-react";
import { cx } from "../lib/cx";
import { FOCUS_RING_CLASSES, PILL_BUTTON_CLASSES } from "../styles";
import type { NearestLookupStatus } from "../types";

interface LocationsHeaderProps {
  headingId: string;
  locationCount: number;
  lookupStatus: NearestLookupStatus;
  onFindNearest: () => void;
}

export function LocationsHeader({
  headingId,
  locationCount,
  lookupStatus,
  onFindNearest,
}: LocationsHeaderProps) {
  const isLocating = lookupStatus === "locating";

  return (
    <div className="mb-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
      <div className="space-y-4">
        <h2
          id={headingId}
          className="text-5xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100"
        >
          Visit
          <br />
          <span className="text-cafe-accent">Us.</span>
        </h2>

        <p className="max-w-md font-medium text-zinc-500 dark:text-zinc-400">
          {locationCount > 1
            ? `${locationCount} locations. Come say hello.`
            : "Come say hello."}
        </p>
      </div>

      {locationCount > 1 && (
        <button
          type="button"
          onClick={onFindNearest}
          disabled={isLocating}
          aria-label="Find nearest location"
          className={cx(
            "flex shrink-0 items-center gap-2 px-5 py-3 disabled:cursor-not-allowed disabled:opacity-60",
            PILL_BUTTON_CLASSES,
            FOCUS_RING_CLASSES,
          )}
        >
          {isLocating ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed
              size={14}
              className="text-cafe-accent"
              aria-hidden="true"
            />
          )}
          {isLocating ? "Locating..." : "Find Nearest"}
        </button>
      )}
    </div>
  );
}
