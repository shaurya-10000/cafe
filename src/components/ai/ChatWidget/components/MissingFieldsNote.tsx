import { memo } from "react";

import { describeMissingFields } from "@/lib/ai/missingFields";
import type { ActionPayload } from "@/types/action";

interface MissingFieldsNoteProps {
  readonly action: ActionPayload;
}

function joinWords(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Lists what an AI prefill action leaves for the user to fill in. */
export const MissingFieldsNote = memo(function MissingFieldsNote({
  action,
}: MissingFieldsNoteProps) {
  const missing = describeMissingFields(action);
  if (missing.length === 0) return null;

  return (
    <p className="px-1 text-[11px] font-medium leading-snug text-cafe-fg/60">
      Still needed:{" "}
      <span className="text-cafe-accent">{joinWords(missing)}</span>. Add it in
      the form, or tell me and I will fill it in.
    </p>
  );
});

MissingFieldsNote.displayName = "MissingFieldsNote";
