"use client";

import { useMemo } from "react";

import { EmptyState, FavoriteCard, LoadingState } from "./components";
import { DEFAULT_CURRENCY } from "./constants";
import { useAddToCart, useRemoveFavorite } from "./hooks";
import { COUNT_CLASS, GRID_CLASS, HEADING_CLASS, ROOT_CLASS } from "./styles";
import type { FavoritesTabProps } from "./types";

/** Customer favorites grid with per-item remove and add-to-order. The parent owns the data. */
export function FavoritesTab({
  favorites,
  favLoading,
  onRemove,
  currency = DEFAULT_CURRENCY,
}: FavoritesTabProps) {
  const { removingIds, remove } = useRemoveFavorite(onRemove);
  const { addingIds, addedIds, add } = useAddToCart();

  const sorted = useMemo(
    () => [...favorites].sort((left, right) => left.name.localeCompare(right.name)),
    [favorites],
  );

  if (favLoading) return <LoadingState />;
  if (sorted.length === 0) return <EmptyState />;

  return (
    <div className={ROOT_CLASS}>
      <h2 className={HEADING_CLASS}>
        Saved items
        <span className={COUNT_CLASS}>{sorted.length}</span>
      </h2>

      <div className={GRID_CLASS}>
        {sorted.map((item) => (
          <FavoriteCard
            key={item.id}
            item={item}
            currency={currency}
            isRemoving={removingIds.has(item.id)}
            isAdding={addingIds.has(item.id)}
            justAdded={addedIds.has(item.id)}
            onRemove={(id) => void remove(id)}
            onAdd={(favorite) => void add(favorite)}
          />
        ))}
      </div>
    </div>
  );
}