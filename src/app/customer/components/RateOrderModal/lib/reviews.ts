import { ALREADY_REVIEWED_MESSAGE, DEFAULT_RATING, UNIQUE_VIOLATION_CODE } from "../constants";
import type { OrderLineItem, RatingMap, RemarkMap } from "../types";

interface BuildReviewRowsInput {
  orderId: string;
  userId: string;
  items: readonly OrderLineItem[];
  ratings: RatingMap;
  remarks: RemarkMap;
}

export function buildReviewRows({
  orderId,
  userId,
  items,
  ratings,
  remarks,
}: BuildReviewRowsInput) {
  return items.map((item) => ({
    order_id: orderId,
    catalog_item_id: item.catalogItemId,
    item_name: item.name,
    rating: ratings[item.catalogItemId] || DEFAULT_RATING,
    remark: remarks[item.catalogItemId]?.trim() || null,
    user_id: userId,
  }));
}

/**
 * unique_violation: this order+item was already reviewed elsewhere (another
 * tab, a retried request) between the modal loading and the submit click.
 */
export function getSubmitErrorMessage(error: {
  code?: string;
  message: string;
}): string {
  return error.code === UNIQUE_VIOLATION_CODE
    ? ALREADY_REVIEWED_MESSAGE
    : error.message;
}