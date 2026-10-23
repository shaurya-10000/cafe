import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { subscribeToNewsletter } from "../api/subscribeToNewsletter";
import { NEWSLETTER_FETCH_TIMEOUT_MS } from "../constants";
import { isValidEmail } from "../lib/email";
import { isAbortError } from "../lib/errors";
import type { SubmitState } from "../types";

interface Options {
  readonly endpoint: string;
  readonly invalidEmailMessage: string;
  readonly genericErrorMessage: string;
}

export function useNewsletterSubscription({
  endpoint,
  invalidEmailMessage,
  genericErrorMessage,
}: Options) {
  const inFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
      inFlightRef.current = false;
    };
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (inFlightRef.current) return;

      const trimmedEmail = email.trim();

      if (!isValidEmail(trimmedEmail)) {
        setStatus("error");
        setMessage(invalidEmailMessage);
        return;
      }

      inFlightRef.current = true;
      setStatus("submitting");
      setMessage("");

      const controller = new AbortController();
      abortRef.current = controller;

      let timedOut = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, NEWSLETTER_FETCH_TIMEOUT_MS);

      try {
        const result = await subscribeToNewsletter({
          endpoint,
          email: trimmedEmail,
          signal: controller.signal,
        });

        if (!isMountedRef.current) return;

        if (result.ok) {
          setStatus("success");
          setMessage("");
          setEmail("");
        } else {
          setStatus("error");
          setMessage(result.message ?? genericErrorMessage);
        }
      } catch (error) {
        if (!isMountedRef.current) return;

        // An abort we did not trigger means the component is going away.
        if (isAbortError(error) && !timedOut) return;

        setStatus("error");
        setMessage(genericErrorMessage);
      } finally {
        clearTimeout(timeoutId);
        inFlightRef.current = false;
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [email, endpoint, invalidEmailMessage, genericErrorMessage],
  );

  const handleEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setEmail(event.target.value);

      // Leave "submitting" alone so a mid-flight edit does not visually
      // cancel the request.
      setStatus((current) =>
        current === "error" || current === "success" ? "idle" : current,
      );
      setMessage("");
    },
    [],
  );

  return {
    email,
    status,
    message,
    isSubmitting: status === "submitting",
    isError: status === "error",
    isSuccess: status === "success",
    handleSubmit,
    handleEmailChange,
  };
}

export type NewsletterSubscription = ReturnType<
  typeof useNewsletterSubscription
>;
