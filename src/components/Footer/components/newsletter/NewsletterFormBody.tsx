import { useId } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsletterSubscription } from "../../hooks/useNewsletterSubscription";
import { getFadeSlideMotion } from "../../lib/motion";
import { FOCUS_RING, INVERTED_FOCUS_RING } from "../../styles";
import type { FooterStrings } from "../../types";
import { NewsletterMessage } from "./NewsletterMessage";

interface NewsletterFormBodyProps {
  readonly subscription: NewsletterSubscription;
  readonly strings: FooterStrings;
  readonly reducedMotion: boolean;
}

export function NewsletterFormBody({
  subscription,
  strings,
  reducedMotion,
}: NewsletterFormBodyProps) {
  const inputId = useId();
  const messageId = useId();

  const {
    email,
    status,
    message,
    isSubmitting,
    isError,
    handleSubmit,
    handleEmailChange,
  } = subscription;

  return (
    <motion.form
      onSubmit={handleSubmit}
      noValidate
      {...getFadeSlideMotion(reducedMotion)}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="sr-only">
            {strings.newsletterEmailLabel}
          </label>

          <input
            id={inputId}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder={strings.newsletterPlaceholder}
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
            aria-invalid={isError ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            className={cn(
              "h-12 w-full rounded-full border",
              "bg-cafe-bg px-5 text-sm",
              "text-cafe-fg placeholder:text-cafe-fg/40",
              "transition-[border-color,box-shadow] duration-200",
              "disabled:cursor-not-allowed disabled:opacity-60",
              "motion-reduce:transition-none",
              isError
                ? "border-red-400 dark:border-red-500/70"
                : "border-cafe-border",
              FOCUS_RING,
            )}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "group inline-flex h-12 shrink-0 items-center justify-center",
            "gap-2 rounded-full bg-cafe-fg px-6",
            "text-sm font-semibold text-cafe-bg",
            "transition-all duration-200",
            "hover:-translate-y-0.5 hover:bg-cafe-fg/90",
            "active:translate-y-0",
            "disabled:cursor-not-allowed disabled:opacity-60",
            "disabled:hover:translate-y-0",
            "motion-reduce:transition-none",
            "motion-reduce:hover:translate-y-0",
            INVERTED_FOCUS_RING,
          )}
        >
          <span>
            {isSubmitting
              ? strings.newsletterSubmitting
              : strings.newsletterSubmit}
          </span>

          {!isSubmitting && (
            <ArrowRight
              aria-hidden="true"
              size={16}
              className={cn(
                "transition-transform duration-200",
                "group-hover:translate-x-0.5",
                "group-focus-visible:translate-x-0.5",
                "motion-reduce:transition-none",
              )}
            />
          )}
        </button>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {message && (
          <NewsletterMessage
            key={`${status}-${message}`}
            id={messageId}
            message={message}
            isError={isError}
            reducedMotion={reducedMotion}
          />
        )}
      </AnimatePresence>
    </motion.form>
  );
}
