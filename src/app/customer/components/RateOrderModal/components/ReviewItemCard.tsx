import { Coffee, MessageSquareQuote } from "lucide-react";

import { MAX_REMARK_LENGTH } from "../constants";
import { ITEM_CARD_CLASS, ITEM_ICON_CLASS, REMARK_INPUT_CLASS } from "../styles";
import type { OrderLineItem, ReviewFormState } from "../types";
import { StarRating } from "./StarRating";

interface ReviewItemCardProps {
  item: OrderLineItem;
  form: ReviewFormState;
}

export function ReviewItemCard({ item, form }: ReviewItemCardProps) {
  const id = item.catalogItemId;
  const remarkId = `remark-${id}`;

  return (
    <div className={ITEM_CARD_CLASS}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div aria-hidden="true" className={ITEM_ICON_CLASS}>
            <Coffee size={18} />
          </div>
          <span className="truncate font-bold text-cafe-fg">{item.name}</span>
        </div>

        <StarRating
          itemName={item.name}
          value={form.ratings[id] || 0}
          hovered={form.hoveredStar[id] || 0}
          onHover={(star) => form.setHover(id, star)}
          onHoverEnd={() => form.setHover(id, 0)}
          onSelect={(star) => form.setRating(id, star)}
        />
      </div>

      <div className="relative">
        <MessageSquareQuote
          size={14}
          className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
          aria-hidden="true"
        />
        <label htmlFor={remarkId} className="sr-only">
          Note for {item.name}
        </label>
        <textarea
          id={remarkId}
          placeholder="Optional note..."
          value={form.remarks[id] || ""}
          onChange={(event) => form.setRemark(id, event.target.value)}
          maxLength={MAX_REMARK_LENGTH}
          rows={2}
          className={REMARK_INPUT_CLASS}
        />
      </div>
    </div>
  );
}