import { useCallback, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { cx } from "../../lib/cx";
import { buildMapEmbedUrl } from "../../lib/urls";
import { CARD_CLASSES, FOCUS_RING_CLASSES } from "../../styles";
import type { BusinessLocation, MapStatus } from "../../types";

interface LocationMapProps {
  location: BusinessLocation;
  /** While a swipe is in progress the iframe must not swallow pointer events. */
  isDragging: boolean;
}

/**
 * Click-to-load facade: the Google Maps iframe is never mounted until the
 * visitor asks for it. idle -> loading (iframe mounted, spinner shown) ->
 * loaded (iframe fired onLoad).
 */
export function LocationMap({ location, isDragging }: LocationMapProps) {
  const [status, setStatus] = useState<MapStatus>("idle");

  const handleLoadRequest = useCallback(() => {
    setStatus((current) => (current === "idle" ? "loading" : current));
  }, []);

  const handleIframeLoad = useCallback(() => {
    setStatus("loaded");
  }, []);

  return (
    <div
      data-testid="location-map"
      className="relative order-1 min-h-[420px] overflow-hidden rounded-[3rem] border border-[#EAE9E4] bg-[#F5F5F1] dark:border-zinc-800 dark:bg-zinc-900 lg:h-auto"
    >
      {status !== "idle" && (
        <iframe
          title={`Interactive map for ${location.name}`}
          src={buildMapEmbedUrl(location)}
          onLoad={handleIframeLoad}
          className={cx(
            "absolute inset-0 h-full w-full border-0",
            isDragging ? "pointer-events-none" : "pointer-events-auto",
          )}
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}

      {status === "loading" && (
        <div
          role="status"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#F5F5F1] text-center dark:bg-zinc-900"
        >
          <div className={cx(CARD_CLASSES, "rounded-full p-4")}>
            <Loader2
              size={24}
              className="animate-spin text-cafe-accent"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
            Loading map...
          </p>
        </div>
      )}

      {status === "idle" && (
        <button
          type="button"
          onClick={handleLoadRequest}
          aria-label={`Load interactive map for ${location.name}`}
          className={cx(
            "absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 text-center transition-colors hover:bg-[#eeede8] dark:hover:bg-zinc-800",
            FOCUS_RING_CLASSES,
          )}
        >
          <div
            aria-hidden="true"
            className={cx(CARD_CLASSES, "rounded-full p-4")}
          >
            <MapPin size={24} className="text-cafe-accent" />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
              Load interactive map
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {location.name}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}
