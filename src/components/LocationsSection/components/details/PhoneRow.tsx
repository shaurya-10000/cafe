import { Phone } from "lucide-react";
import { cx } from "../../lib/cx";
import { FIELD_VALUE_CLASSES, FOCUS_RING_CLASSES } from "../../styles";
import { FieldLabel, InfoRow } from "./InfoRow";

interface PhoneRowProps {
  phone: string;
  locationName: string;
}

export function PhoneRow({ phone, locationName }: PhoneRowProps) {
  return (
    <InfoRow icon={Phone}>
      <div>
        <FieldLabel>Phone</FieldLabel>
        <a
          href={`tel:${phone}`}
          aria-label={`Call ${locationName}`}
          className={cx(
            FIELD_VALUE_CLASSES,
            "transition-colors hover:text-cafe-accent",
            FOCUS_RING_CLASSES,
          )}
        >
          {phone}
        </a>
      </div>
    </InfoRow>
  );
}
