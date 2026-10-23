import type { NearestLookupStatus } from "../types";

interface NearestStatusProps {
  status: NearestLookupStatus;
}

export function NearestStatus({ status }: NearestStatusProps) {
  if (status === "unavailable") {
    return (
      <p
        role="status"
        className="-mt-6 mb-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
      >
        Location access unavailable. Pick a location manually below.
      </p>
    );
  }

  if (status === "success") {
    return (
      <p role="status" className="sr-only">
        Nearest location selected.
      </p>
    );
  }

  return null;
}
