import { MapPin } from "lucide-react";
import { MUTED_MESSAGE_CLASSES } from "../styles";

export function LocationsEmpty() {
  return (
    <section
      data-testid="locations-section"
      aria-live="polite"
      className="mx-auto w-full max-w-7xl px-6 py-24 text-center"
    >
      <div className={MUTED_MESSAGE_CLASSES}>
        <MapPin size={16} aria-hidden="true" />
        <p>No locations available right now.</p>
      </div>
    </section>
  );
}
