import { Coffee, Loader2, Trash2 } from "lucide-react";

import { formatPrice } from "../lib/format";
import {
  CARD_CLASS,
  CARD_ICON_CLASS,
  NAME_CLASS,
  PRICE_CLASS,
  REMOVE_BUTTON_CLASS,
} from "../styles";
import type { FavoriteItem } from "../types";

interface FavoriteCardProps {
  item: FavoriteItem;
  currency: string;
  isRemoving: boolean;
  onRemove: (id: string) => void;
}

export function FavoriteCard({
  item,
  currency,
  isRemoving,
  onRemove,
}: FavoriteCardProps) {
  return (
    <div className={CARD_CLASS}>
      <div className="mb-6 flex items-start justify-between">
        <div aria-hidden="true" className={CARD_ICON_CLASS}>
          <Coffee size={20} />
        </div>

        <button
          type="button"
          onClick={() => onRemove(item.id)}
          disabled={isRemoving}
          aria-label={`Remove ${item.name} from favorites`}
          aria-busy={isRemoving}
          className={REMOVE_BUTTON_CLASS}
        >
          {isRemoving ? (
            <Loader2 size={18} className="animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <div>
        <h3 className={NAME_CLASS}>{item.name}</h3>
        <p className={PRICE_CLASS}>
          {formatPrice(item.numeric_price, currency)}
        </p>
      </div>
    </div>
  );
}