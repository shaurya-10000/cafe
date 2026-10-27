import { useCallback, useRef } from "react";
import type { KeyboardEvent } from "react";
import { cx } from "../lib/cx";
import { getTabId } from "../lib/ids";
import { FOCUS_RING_CLASSES } from "../styles";
import type { BusinessLocation } from "../types";

interface LocationTabsProps {
  instanceId: string;
  panelId: string;
  locations: readonly BusinessLocation[];
  activeIndex: number;
  nearestId: string | null;
  onSelect: (index: number) => void;
}

function getTargetIndex(
  key: string,
  current: number,
  count: number,
): number | null {
  switch (key) {
    case "ArrowRight":
      return (current + 1) % count;
    case "ArrowLeft":
      return (current - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return count - 1;
    default:
      return null;
  }
}

/**
 * ARIA tablist with roving tabindex: arrow keys move selection and focus
 * together, per the standard tabs interaction pattern.
 */
export function LocationTabs({
  instanceId,
  panelId,
  locations,
  activeIndex,
  nearestId,
  onSelect,
}: LocationTabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (locations.length < 2) return;

      const nextIndex = getTargetIndex(
        event.key,
        activeIndex,
        locations.length,
      );
      if (nextIndex === null) return;

      event.preventDefault();
      onSelect(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    },
    [activeIndex, locations.length, onSelect],
  );

  return (
    <div
      role="tablist"
      aria-label="Choose a location"
      aria-orientation="horizontal"
      className="mb-10 flex flex-wrap gap-2"
      onKeyDown={handleKeyDown}
    >
      {locations.map((location, index) => {
        const isActive = index === activeIndex;
        const isNearest = location.id === nearestId;

        return (
          <button
            key={location.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={getTabId(instanceId, location.id)}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(index)}
            className={cx(
              "flex items-center gap-2 rounded-full border px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
              FOCUS_RING_CLASSES,
              isActive
                ? "border-transparent bg-zinc-900 text-white dark:bg-zinc-100 dark:text-black"
                : "border-[#EAE9E4] bg-transparent text-zinc-600 hover:border-cafe-accent dark:border-zinc-800 dark:text-zinc-400",
            )}
          >
            {location.name}
            {isNearest && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-cafe-accent"
                aria-label="Nearest location"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
