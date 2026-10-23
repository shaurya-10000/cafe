import { memo } from "react";

interface ResultsStatusProps {
  loading: boolean;
  count: number;
}

/** Screen-reader announcement for loading and result counts. */
export const ResultsStatus = memo(function ResultsStatus({
  loading,
  count,
}: ResultsStatusProps) {
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {loading
        ? "Loading menu items\u2026"
        : `${count} item${count === 1 ? "" : "s"} found`}
    </p>
  );
});
