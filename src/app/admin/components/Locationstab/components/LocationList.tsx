import { memo, useMemo } from "react";

import { MapPin } from "lucide-react";

import { splitLocations } from "../lib/locations";
import type { AdminLocation, PendingAction, ReorderDirection } from "../types";
import { LocationRow } from "./LocationRow";

interface LocationListProps {
  locations: AdminLocation[];
  pending: PendingAction | null;
  busy: boolean;
  onEdit: (location: AdminLocation) => void;
  onToggle: (location: AdminLocation) => void;
  onDelete: (location: AdminLocation) => void;
  onReorder: (location: AdminLocation, direction: ReorderDirection) => void;
}

export const LocationList = memo(function LocationList({
  locations,
  pending,
  busy,
  onEdit,
  onToggle,
  onDelete,
  onReorder,
}: LocationListProps) {
  const ordered = useMemo(() => {
    const { active, inactive } = splitLocations(locations);

    return { active, rows: [...active, ...inactive] };
  }, [locations]);

  return (
    <div className="flex min-h-[400px] flex-col overflow-hidden rounded-[2.5rem] border border-cafe-border bg-cafe-card p-4">
      {locations.length === 0 && (
        <div className="py-24 text-center">
          <MapPin
            size={40}
            className="mx-auto mb-4 text-gray-500/50"
            strokeWidth={1}
            aria-hidden="true"
          />

          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
            No locations yet
          </p>
        </div>
      )}

      {ordered.rows.map((location, index) => {
        const isActive = location.isActive;

        return (
          <LocationRow
            key={location.id}
            location={location}
            isFirstActive={isActive && index === 0}
            isLastActive={isActive && index === ordered.active.length - 1}
            busy={busy}
            isToggling={pending?.kind === "toggle" && pending.id === location.id}
            isReordering={pending?.kind === "reorder" && pending.id === location.id}
            isDeleting={pending?.kind === "delete" && pending.id === location.id}
            onEdit={onEdit}
            onToggle={onToggle}
            onDelete={onDelete}
            onReorder={onReorder}
          />
        );
      })}
    </div>
  );
});
