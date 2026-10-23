import { AlertCircle } from "lucide-react";

import { ERROR_BANNER_CLASS } from "../styles";

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div role="alert" className={ERROR_BANNER_CLASS}>
      <AlertCircle size={14} aria-hidden="true" />
      {message}
    </div>
  );
}