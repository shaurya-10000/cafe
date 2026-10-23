import { AlertCircle } from "lucide-react";

import { ERROR_ALERT_CLASS } from "../styles";

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className={ERROR_ALERT_CLASS}>
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </div>
  );
}