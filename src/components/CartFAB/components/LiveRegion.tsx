import { LIVE_REGION_CLASS } from "../styles";

interface LiveRegionProps {
  message: string;
}

/**
 * Lives outside LazyMotion/AnimatePresence so it stays in the accessibility
 * tree whether or not the FAB is rendered.
 */
export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <span className={LIVE_REGION_CLASS} aria-live="polite" aria-atomic="true">
      {message}
    </span>
  );
}