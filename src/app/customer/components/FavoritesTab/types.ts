/**
 * Mirrors the fields this tab actually needs from catalog_items. `id` is a
 * uuid (favorites.item_id / catalog_items.id are never numeric in this
 * schema), and price is numeric_price, the source of truth, rather than any
 * preformatted or currency-prefixed string: this tab decides how to display
 * it, not whatever supplied the data.
 */
export interface FavoriteItem {
  id: string;
  name: string;
  numeric_price: number;
}

export interface FavoritesTabProps {
  favorites: FavoriteItem[];
  favLoading: boolean;
  onRemove: (id: string) => void | Promise<void>;
  /**
   * ISO 4217 code from business_settings.currency. Defaults to "USD" only as
   * a last resort: thread the real value down from whatever fetches
   * `favorites`, or prices here will silently disagree with the rest of the
   * app for a non-USD business.
   */
  currency?: string;
}