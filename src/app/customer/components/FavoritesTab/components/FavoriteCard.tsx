import { Check, Coffee, Loader2, Plus, Trash2 } from "lucide-react";

import { formatPrice } from "../lib/format";
import {
  ADD_BUTTON_CLASS,
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
  isAdding: boolean;
  justAdded: boolean;
  onRemove: (id: string) => void;
  onAdd: (item: FavoriteItem) => void;
}

export function FavoriteCard({
  item,
  currency,
  isRemoving,
  isAdding,
  justAdded,
  onRemove,
  onAdd,
}: FavoriteCardProps) {
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-start justify-between">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className={NAME_CLASS}>{item.name}</h3>
          <p className={PRICE_CLASS}>
            {formatPrice(item.numeric_price, currency)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAdd(item)}
          disabled={isAdding || isRemoving}
          aria-label={`Add ${item.name} to your order`}
          aria-busy={isAdding}
          className={ADD_BUTTON_CLASS}
        >
          {isAdding ? (
            <>
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Adding
            </>
          ) : justAdded ? (
            <>
              <Check size={14} aria-hidden="true" />
              Added
            </>
          ) : (
            <>
              <Plus size={14} aria-hidden="true" />
              Add to order
            </>
          )}
        </button>
      </div>
    </div>
  );
}