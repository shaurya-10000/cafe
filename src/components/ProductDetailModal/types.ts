import type { CatalogItem } from "@/types/catalog";
import type { useSupabaseClient } from "@/utils/supabase/client";

export interface ProductDetailModalProps {
  /**
   * null closes the modal. Controlled by the parent (e.g. CatalogGrid).
   *
   * Expected to be derived from the parent's live catalog state (e.g.
   * `items.find(i => i.id === selectedItemId)`), not a copy frozen at
   * click-time: a realtime price/availability change while this is open is
   * then reflected here, and the modal auto-closes if the item is deactivated.
   */
  item: CatalogItem | null;
  onClose: () => void;
  onAddToCart: (item: CatalogItem, quantity: number) => void;
  isFavorited: boolean;
  isFavoritePending: boolean;
  onToggleFavorite: (id: string) => void;
  /**
   * ISO 4217 code. Pass the same value CatalogGrid resolved from
   * business_settings.currency so the price shown here always matches what
   * the customer saw on the card.
   */
  currency: string;
}

export interface ReviewStats {
  reviewCount: number;
  averageRating: number | null;
}

export interface PublicReview {
  id: string;
  rating: number;
  remark: string | null;
  createdAt: string;
}

/** One fetched page. `rawCount` is rows returned before validation. */
export interface ReviewsPage {
  reviews: PublicReview[];
  rawCount: number;
}

export type StepDirection = "prev" | "next";

export type SupabaseClient = ReturnType<typeof useSupabaseClient>;
