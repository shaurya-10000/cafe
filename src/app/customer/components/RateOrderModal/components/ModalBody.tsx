import type { LoadState, OrderLineItem, ReviewFormState } from "../types";
import {
  AllReviewedPanel,
  LoadingPanel,
  NotFoundPanel,
  NotRatablePanel,
  SuccessPanel,
} from "./StatusPanels";
import { ReviewForm } from "./ReviewForm";

interface ModalBodyProps {
  loadState: LoadState;
  ratableItems: readonly OrderLineItem[];
  form: ReviewFormState;
}

export function ModalBody({ loadState, ratableItems, form }: ModalBodyProps) {
  return (
    <>
      {loadState.status === "loading" && <LoadingPanel />}
      {loadState.status === "not-found" && <NotFoundPanel />}
      {loadState.status === "not-ratable" && (
        <NotRatablePanel reason={loadState.reason} />
      )}

      {loadState.status === "ready" && !form.isFinished && (
        <>
          {ratableItems.length === 0 ? (
            <AllReviewedPanel />
          ) : (
            <ReviewForm items={ratableItems} form={form} />
          )}
        </>
      )}

      {form.isFinished && <SuccessPanel />}
    </>
  );
}