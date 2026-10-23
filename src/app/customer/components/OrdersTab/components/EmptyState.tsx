import { Package } from "lucide-react";

import { VIEW_OPTIONS } from "../constants";
import { EMPTY_CLASS, EMPTY_ICON_CLASS, EMPTY_TEXT_CLASS } from "../styles";
import type { OrderView } from "../types";

export function EmptyState({ view }: { view: OrderView }) {
  const label = VIEW_OPTIONS.find((option) => option.id === view)?.emptyLabel;

  return (
    <div className={EMPTY_CLASS}>
      <Package
        size={48}
        className={EMPTY_ICON_CLASS}
        strokeWidth={1}
        aria-hidden="true"
      />
      <p className={EMPTY_TEXT_CLASS}>No {label} orders found</p>
    </div>
  );
}