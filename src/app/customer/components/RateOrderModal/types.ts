import type { useSupabaseClient } from "@/utils/supabase/client";

export type ModalSupabaseClient = ReturnType<typeof useSupabaseClient>;

export interface RateOrderModalProps {
  orderId: string;
  onClose: () => void;
  /**
   * Fires once at least one review is successfully submitted, so the host
   * list can optimistically reflect it without a full refetch.
   */
  onSubmitted?: () => void;
}

export interface OrderLineItem {
  catalogItemId: string;
  name: string;
}

export type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "not-ratable"; reason: string }
  | { status: "ready"; items: OrderLineItem[] };

export type RatingMap = Record<string, number>;
export type RemarkMap = Record<string, string>;

export interface CatalogNameRow {
  id: string;
  name: string;
}

export interface ReviewedRow {
  catalog_item_id: string | null;
}

export interface ReviewFormState {
  ratings: RatingMap;
  remarks: RemarkMap;
  hoveredStar: RatingMap;
  isSubmitting: boolean;
  isFinished: boolean;
  errorMessage: string | null;
  setRating: (catalogItemId: string, star: number) => void;
  setRemark: (catalogItemId: string, text: string) => void;
  setHover: (catalogItemId: string, star: number) => void;
  submit: () => Promise<void>;
}