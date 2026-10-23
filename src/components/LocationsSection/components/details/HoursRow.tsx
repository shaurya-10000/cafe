import { Clock } from "lucide-react";
import { FIELD_VALUE_CLASSES } from "../../styles";
import { FieldLabel, InfoRow } from "./InfoRow";

interface HoursRowProps {
  weekday: string;
  weekend: string;
}

/** Hours are free-text as stored; the schema has no structured schedule. */
export function HoursRow({ weekday, weekend }: HoursRowProps) {
  return (
    <InfoRow icon={Clock}>
      <div className="space-y-1">
        <div>
          <FieldLabel>Weekdays</FieldLabel>
          <p className={FIELD_VALUE_CLASSES}>{weekday}</p>
        </div>
        <div>
          <FieldLabel>Weekends</FieldLabel>
          <p className={FIELD_VALUE_CLASSES}>{weekend}</p>
        </div>
      </div>
    </InfoRow>
  );
}
