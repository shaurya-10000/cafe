import { Loader2 } from "lucide-react";

export function LocationsLoading() {
  return (
    <section
      data-testid="locations-section"
      aria-busy="true"
      aria-label="Loading locations"
      className="mx-auto flex min-h-[400px] w-full max-w-7xl items-center justify-center px-6 py-24"
    >
      <Loader2
        className="animate-spin text-cafe-accent"
        size={32}
        aria-hidden="true"
      />
      <span className="sr-only">Loading locations</span>
    </section>
  );
}
