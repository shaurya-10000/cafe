import { useCallback, useState } from "react";
import type { CatalogItem } from "@/types/catalog";
import { MAX_QUANTITY, MIN_QUANTITY } from "../constants";
import { getMediaList } from "../lib/media";
import { ProductGallery } from "./gallery/ProductGallery";
import { AddToCartButton } from "./product/AddToCartButton";
import { FavoriteButton } from "./product/FavoriteButton";
import { ProductHeader } from "./product/ProductHeader";
import { QuantityStepper } from "./product/QuantityStepper";
import { ReviewsSection } from "./reviews/ReviewsSection";

interface ProductContentProps {
  readonly item: CatalogItem;
  readonly titleId: string;
  readonly currency: string;
  readonly reducedMotion: boolean;
  readonly isFavorited: boolean;
  readonly isFavoritePending: boolean;
  readonly onToggleFavorite: (id: string) => void;
  readonly onAddToCart: (item: CatalogItem, quantity: number) => void;
  readonly onClose: () => void;
}

/**
 * Mounted with key={item.id} by the modal, so quantity, gallery position and
 * reviews all reset naturally whenever a different item opens.
 */
export function ProductContent({
  item,
  titleId,
  currency,
  reducedMotion,
  isFavorited,
  isFavoritePending,
  onToggleFavorite,
  onAddToCart,
  onClose,
}: ProductContentProps) {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);

  const decrement = useCallback(
    () => setQuantity((q) => Math.max(MIN_QUANTITY, q - 1)),
    [],
  );
  const increment = useCallback(
    () => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1)),
    [],
  );

  const handleAdd = useCallback(() => {
    onAddToCart(item, quantity);
    onClose();
  }, [item, quantity, onAddToCart, onClose]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      <ProductGallery
        name={item.name}
        media={getMediaList(item)}
        reducedMotion={reducedMotion}
      />

      <div className="flex flex-col space-y-6 p-6 md:p-8">
        <ProductHeader item={item} titleId={titleId} currency={currency} />

        {item.description && (
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <QuantityStepper
            quantity={quantity}
            onDecrement={decrement}
            onIncrement={increment}
          />

          <FavoriteButton
            itemName={item.name}
            isFavorited={isFavorited}
            isPending={isFavoritePending}
            onToggle={() => onToggleFavorite(item.id)}
          />
        </div>

        <AddToCartButton quantity={quantity} onClick={handleAdd} />

        <ReviewsSection itemId={item.id} />
      </div>
    </div>
  );
}
