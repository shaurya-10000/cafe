"use client";

import { useId } from "react";
import { LocationCarousel } from "./components/carousel/LocationCarousel";
import { LocationsEmpty } from "./components/LocationsEmpty";
import { LocationsError } from "./components/LocationsError";
import { LocationsHeader } from "./components/LocationsHeader";
import { LocationsLoading } from "./components/LocationsLoading";
import { LocationTabs } from "./components/LocationTabs";
import { NearestStatus } from "./components/NearestStatus";
import { useLocationSelection } from "./hooks/useLocationSelection";
import { useLocationSelectionEvent } from "./hooks/useLocationSelectionEvent";
import { useLocations } from "./hooks/useLocations";
import { useNearestLocation } from "./hooks/useNearestLocation";
import { getHeadingId, getPanelId, getTabId } from "./lib/ids";
import { SECTION_CLASSES } from "./styles";
import type { BusinessLocation, TabPanelAttributes } from "./types";

/** Stable identity so selection state doesn't reset on every render. */
const NO_LOCATIONS: readonly BusinessLocation[] = [];

export default function LocationsSection() {
  const instanceId = useId();
  const { state, reload } = useLocations();

  const locations = state.status === "ready" ? state.locations : NO_LOCATIONS;
  const {
    activeIndex,
    activeLocation,
    nearestId,
    selectIndex,
    selectById,
    selectNearest,
    step,
  } = useLocationSelection(locations);

  const nearest = useNearestLocation(locations, (location) =>
    selectNearest(location.id),
  );
  useLocationSelectionEvent(selectById);

  if (state.status === "loading") return <LocationsLoading />;
  if (state.status === "error") {
    return <LocationsError kind={state.kind} onRetry={reload} />;
  }
  if (!activeLocation) return <LocationsEmpty />;

  const hasMultiple = locations.length > 1;
  const headingId = getHeadingId(instanceId);
  const panelId = getPanelId(instanceId);
  const panel: TabPanelAttributes | undefined = hasMultiple
    ? { id: panelId, labelledBy: getTabId(instanceId, activeLocation.id) }
    : undefined;

  return (
    <section
      data-testid="locations-section"
      aria-labelledby={headingId}
      className={SECTION_CLASSES}
    >
      <LocationsHeader
        headingId={headingId}
        locationCount={locations.length}
        lookupStatus={nearest.status}
        onFindNearest={nearest.detect}
      />

      <NearestStatus status={nearest.status} />

      {hasMultiple && (
        <LocationTabs
          instanceId={instanceId}
          panelId={panelId}
          locations={locations}
          activeIndex={activeIndex}
          nearestId={nearestId}
          onSelect={selectIndex}
        />
      )}

      <LocationCarousel
        locations={locations}
        activeIndex={activeIndex}
        activeLocation={activeLocation}
        panel={panel}
        onSelectIndex={selectIndex}
        onStep={step}
      />
    </section>
  );
}
