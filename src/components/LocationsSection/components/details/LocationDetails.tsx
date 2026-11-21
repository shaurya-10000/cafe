import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/utils/supabase/client";
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
  const supabase = useSupabaseClient();
  const [todayBadge, setTodayBadge] = useState<{ closed: boolean; label: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const dow = now.getDay();

    Promise.all([
      supabase
        .from("location_closures")
        .select("reason")
        .eq("location_id", location.id)
        .eq("closed_on", todayStr)
        .maybeSingle(),
      supabase
        .from("location_opening_hours")
        .select("open_time, close_time, is_closed")
        .eq("location_id", location.id)
        .eq("day_of_week", dow)
        .maybeSingle(),
    ]).then(([cRes, hRes]) => {
      if (cancelled) return;
      if (cRes.data) {
        setTodayBadge({
          closed: true,
          label: cRes.data.reason ? `Closed Today (${cRes.data.reason})` : "Closed Today",
        });
        return;
      }
      if (hRes.data?.is_closed) {
        setTodayBadge({ closed: true, label: "Closed Today" });
        return;
      }
      if (hRes.data?.open_time && hRes.data?.close_time) {
        setTodayBadge({
          closed: false,
          label: `Open Today · ${String(hRes.data.open_time).slice(0, 5)}–${String(hRes.data.close_time).slice(0, 5)}`,
        });
        return;
      }
      setTodayBadge(null);
    });
    return () => {
      cancelled = true;
    };
  }, [location.id, supabase]);

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

      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 dark:text-zinc-100">
        {location.name}
      </h3>
        {todayBadge && (
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
              todayBadge.closed
                ? "bg-red-500/10 text-red-500"
                : "bg-emerald-500/10 text-emerald-500"
            }`}
          >
            {todayBadge.label}
          </span>
        )}
      </div>

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
