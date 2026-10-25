import { Star } from "lucide-react";

import { STAR_FILL_COLOR, STAR_VALUES } from "../constants";
import { STAR_BUTTON_CLASS } from "../styles";

interface StarRatingProps {
  itemName: string;
  value: number;
  hovered: number;
  onHover: (star: number) => void;
  onHoverEnd: () => void;
  onSelect: (star: number) => void;
}

export function StarRating({
  itemName,
  value,
  hovered,
  onHover,
  onHoverEnd,
  onSelect,
}: StarRatingProps) {
  const visualValue = hovered || value;

  return (
    <div
      role="radiogroup"
      aria-label={`Rating for ${itemName}`}
      className="flex shrink-0 gap-0.5"
    >
      {STAR_VALUES.map((star) => {
        const isFilled = visualValue >= star;

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onHoverEnd}
            onClick={() => onSelect(star)}
            aria-label={`Rate ${itemName} ${star} star${star > 1 ? "s" : ""}`}
            className={STAR_BUTTON_CLASS}
          >
            <Star
              size={20}
              aria-hidden="true"
              fill={isFilled ? STAR_FILL_COLOR : "none"}
              className={isFilled ? "text-cafe-accent" : "text-gray-400"}
            />
          </button>
        );
      })}
    </div>
  );
}