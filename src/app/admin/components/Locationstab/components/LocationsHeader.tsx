import { memo } from "react";

interface LocationsHeaderProps {
  activeCount: number;
  inactiveCount: number;
}

export const LocationsHeader = memo(function LocationsHeader({
  activeCount,
  inactiveCount,
}: LocationsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-cafe-border pb-8 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tighter text-cafe-fg md:text-4xl">
          Locations
        </h1>

        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Business Location Network
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-full border border-cafe-accent/10 bg-cafe-accent/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-cafe-accent">
        <div
          aria-hidden="true"
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-cafe-accent"
        />

        {activeCount} Active

        {inactiveCount > 0 && (
          <span className="text-gray-500">
            &middot; {inactiveCount} Inactive
          </span>
        )}
      </div>
    </header>
  );
});
