"use client";

import { EmptyState, FavoriteCard, LoadingState } from "./components";
import { DEFAULT_CURRENCY } from "./constants";
import { useRemoveFavorite } from "./hooks";
import { GRID_CLASS } from "./styles";
import type { FavoritesTabProps } from "./types";

/** Customer favorites grid with per-item remove. The parent owns the data. */
export function FavoritesTab({
  favorites,
  favLoading,
  onRemove,
  currency = DEFAULT_CURRENCY,
}: FavoritesTabProps) {
  const { removingIds, remove } = useRemoveFavorite(onRemove);

  if (favLoading) return <LoadingState />;

  return (
    <div className={GRID_CLASS}>
      {favorites.length === 0 ? (
        <EmptyState />
      ) : (
        favorites.map((item) => (
          <FavoriteCard
            key={item.id}
            item={item}
            currency={currency}
            isRemoving={removingIds.has(item.id)}
            onRemove={(id) => void remove(id)}
          />
        ))
      )}
    </div>
  );
}