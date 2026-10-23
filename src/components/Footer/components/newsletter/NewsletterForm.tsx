import { memo } from "react";
import { AnimatePresence } from "framer-motion";
import { useNewsletterSubscription } from "../../hooks/useNewsletterSubscription";
import type { FooterStrings } from "../../types";
import { NewsletterFormBody } from "./NewsletterFormBody";
import { NewsletterSuccess } from "./NewsletterSuccess";

interface NewsletterFormProps {
  readonly reducedMotion: boolean;
  readonly endpoint: string;
  readonly strings: FooterStrings;
}

export const NewsletterForm = memo(function NewsletterForm({
  reducedMotion,
  endpoint,
  strings,
}: NewsletterFormProps) {
  const subscription = useNewsletterSubscription({
    endpoint,
    invalidEmailMessage: strings.newsletterInvalidEmail,
    genericErrorMessage: strings.newsletterGenericError,
  });

  return (
    <div className="max-w-xl">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-cafe-accent">
        {strings.newsletterEyebrow}
      </p>

      <h2 className="max-w-md font-serif text-2xl font-medium tracking-tight text-cafe-fg sm:text-3xl">
        {strings.newsletterHeadlineLine1}
        <br aria-hidden="true" />
        {strings.newsletterHeadlineLine2}
      </h2>

      <p className="mt-4 max-w-md text-sm leading-6 text-cafe-fg/60">
        {strings.newsletterDescription}
      </p>

      <div className="mt-6">
        <AnimatePresence initial={false} mode="wait">
          {subscription.isSuccess ? (
            <NewsletterSuccess
              key="newsletter-success"
              title={strings.newsletterSuccessTitle}
              body={strings.newsletterSuccessBody}
              reducedMotion={reducedMotion}
            />
          ) : (
            <NewsletterFormBody
              key="newsletter-form"
              subscription={subscription}
              strings={strings}
              reducedMotion={reducedMotion}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
