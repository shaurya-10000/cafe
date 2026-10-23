import { Loader2 } from "lucide-react";

import { SUBMIT_BUTTON_CLASS } from "../styles";
import type { OrderLineItem, ReviewFormState } from "../types";
import { ErrorAlert } from "./ErrorAlert";
import { ReviewItemCard } from "./ReviewItemCard";

interface ReviewFormProps {
  items: readonly OrderLineItem[];
  form: ReviewFormState;
}

export function ReviewForm({ items, form }: ReviewFormProps) {
  return (
    <div className="space-y-6">
      {items.map((item) => (
        <ReviewItemCard key={item.catalogItemId} item={item} form={form} />
      ))}

      {form.errorMessage && <ErrorAlert message={form.errorMessage} />}

      <button
        type="button"
        onClick={() => void form.submit()}
        disabled={form.isSubmitting}
        aria-busy={form.isSubmitting}
        className={SUBMIT_BUTTON_CLASS}
      >
        {form.isSubmitting ? (
          <>
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
            Submitting…
          </>
        ) : (
          "Submit Ratings"
        )}
      </button>
    </div>
  );
}