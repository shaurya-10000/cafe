import { memo } from "react";

import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Loader2,
  MapPin,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";

import { cx } from "../lib/cx";
import { ROW_ICON_BUTTON_CLASS } from "../styles";
import type { AdminLocation, ReorderDirection } from "../types";

interface LocationRowProps {
  location: AdminLocation;
  isFirstActive: boolean;
  isLastActive: boolean;
  /** Any action (or an image upload) is running: lock the row's buttons. */
  busy: boolean;
  isToggling: boolean;
  isReordering: boolean;
  isDeleting: boolean;
  onEdit: (location: AdminLocation) => void;
  onToggle: (location: AdminLocation) => void;
  onDelete: (location: AdminLocation) => void;
  onReorder: (location: AdminLocation, direction: ReorderDirection) => void;
}

export const LocationRow = memo(function LocationRow({
  location,
  isFirstActive,
  isLastActive,
  busy,
  isToggling,
  isReordering,
  isDeleting,
  onEdit,
  onToggle,
  onDelete,
  onReorder,
}: LocationRowProps) {
  const isInactive = !location.isActive;

  return (
    <div
      className={cx(
        "flex flex-col justify-between gap-4 rounded-3xl border p-4 transition-all sm:flex-row sm:items-center",
        isInactive
          ? "border-transparent opacity-60"
          : "border-transparent hover:border-cafe-border hover:bg-cafe-fg/[0.03]",
      )}
    >
      <div className="flex min-w-0 items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cafe-border bg-cafe-fg/5">
          {location.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={location.imageUrl}
              alt=""
              className="h-full w-full object-cover opacity-70"
            />
          ) : (
            <MapPin size={20} className="text-gray-500" aria-hidden="true" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-cafe-fg">
              {location.name}
            </p>

            {isInactive && (
              <span className="shrink-0 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-400">
                Inactive
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500">
            {location.address}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2">
        {!isInactive && (
          <>
            <button
              type="button"
              onClick={() => onReorder(location, "up")}
              disabled={isFirstActive || isReordering || busy}
              aria-label={`Move ${location.name} up`}
              aria-busy={isReordering}
              className={ROW_ICON_BUTTON_CLASS}
            >
              {isReordering ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowUp size={14} aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => onReorder(location, "down")}
              disabled={isLastActive || isReordering || busy}
              aria-label={`Move ${location.name} down`}
              aria-busy={isReordering}
              className={ROW_ICON_BUTTON_CLASS}
            >
              {isReordering ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <ArrowDown size={14} aria-hidden="true" />
              )}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onEdit(location)}
          disabled={busy}
          aria-label={`Edit ${location.name}`}
          className={ROW_ICON_BUTTON_CLASS}
        >
          <Edit3 size={16} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onToggle(location)}
          disabled={isToggling || busy}
          aria-label={
            isInactive
              ? `Reactivate ${location.name}`
              : `Deactivate ${location.name}`
          }
          aria-busy={isToggling}
          className={cx(
            "rounded-xl border p-2.5 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2",
            isInactive
              ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-500/70 hover:bg-emerald-500/20 focus-visible:ring-emerald-500"
              : "border-amber-500/10 bg-amber-500/5 text-amber-500/60 hover:bg-amber-500/20 focus-visible:ring-amber-500",
          )}
        >
          {isToggling ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : isInactive ? (
            <RotateCcw size={16} aria-hidden="true" />
          ) : (
            <X size={16} aria-hidden="true" />
          )}
        </button>

        {isInactive && (
          <button
            type="button"
            onClick={() => onDelete(location)}
            disabled={isDeleting || busy}
            aria-label={`Permanently delete ${location.name}`}
            aria-busy={isDeleting}
            className="rounded-xl border border-red-500/10 bg-red-500/5 p-2.5 text-red-500/50 transition-all hover:bg-red-500/20 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
