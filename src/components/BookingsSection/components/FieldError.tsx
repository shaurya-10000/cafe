import { memo } from "react";

import { errorIdFor } from "../lib/a11y";

interface FieldErrorProps {
  fieldId: string;
  message: string | undefined;
}

export const FieldError = memo(function FieldError({
  fieldId,
  message,
}: FieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={errorIdFor(fieldId)}
      role="alert"
      className="text-[10px] font-bold text-red-500"
    >
      {message}
    </p>
  );
});
