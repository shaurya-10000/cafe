import { Navigation } from "lucide-react";
import { cx } from "../../lib/cx";
import { buildDirectionsUrl } from "../../lib/urls";
import { FOCUS_RING_CLASSES } from "../../styles";
import type { BusinessLocation, TabPanelAttributes } from "../../types";
import { AddressRow } from "./AddressRow";
import { HoursRow } from "./HoursRow";
import { LocationImage } from "./LocationImage";
import { PhoneRow } from "./PhoneRow";

interface LocationDetailsProps {
  location: BusinessLocation;
  /** True for the first slide so its image is preloaded. */
  isPriority: boolean;
  /** Present only when the section renders as a tabbed UI. */
  panel?: TabPanelAttributes;
}

export function LocationDetails({
  location,
  isPriority,
  panel,
}: LocationDetailsProps) {
  return (
    <div
      className="order-2 flex flex-col justify-center space-y-8 lg:order-1"
      role={panel ? "tabpanel" : undefined}
      id={panel?.id}
      aria-labelledby={panel?.labelledBy}
    >
      <LocationImage
        name={location.name}
        imageUrl={location.imageUrl}
        priority={isPriority}
      />

      <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
        {location.name}
      </h3>

      <div className="space-y-6">
        <AddressRow address={location.address} />
        <HoursRow
          weekday={location.hoursWeekday}
          weekend={location.hoursWeekend}
        />
        {location.phone && (
          <PhoneRow phone={location.phone} locationName={location.name} />
        )}
      </div>

      <a
        href={buildDirectionsUrl(location)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Get directions to ${location.name}`}
        className={cx(
          "flex w-fit items-center justify-center gap-3 rounded-full bg-zinc-900 px-8 py-4 text-xs font-black uppercase tracking-widest text-white transition-transform hover:scale-[1.02] active:scale-95 dark:bg-zinc-100 dark:text-black",
          FOCUS_RING_CLASSES,
        )}
      >
        <Navigation size={16} aria-hidden="true" />
        Get Directions
      </a>
    </div>
  );
}
