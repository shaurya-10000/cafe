"use client";

import { useCallback, useId } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { useUser } from "@clerk/nextjs";

import { BookingForm } from "./components/BookingForm";
import { BookingIntro } from "./components/BookingIntro";
import { BookingSuccess } from "./components/BookingSuccess";
import { EVENTS, SECTION_ID } from "./constants";
import { useBookingForm } from "./hooks/useBookingForm";
import { useBookingLocations } from "./hooks/useBookingLocations";
import { useBookingPrefill } from "./hooks/useBookingPrefill";
import { useBookingSubmit } from "./hooks/useBookingSubmit";
import { useTodayDate } from "./hooks/useTodayDate";
import { containerVariants, itemVariants } from "./motion";
import { CARD_CLASS, SECTION_CLASS } from "./styles";
import type { FieldChangeHandler } from "./types";

export default function BookingsSection() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const prefersReducedMotion = useReducedMotion();

  const motionEnabled = !prefersReducedMotion;

  const headingId = useId();

  const { today, refresh: refreshToday } = useTodayDate();

  /* ---- Data -------------------------------------------------------------- */

  const { locations, status, settings, retry } = useBookingLocations();

  const sessionEmail = user?.primaryEmailAddress?.emailAddress?.trim();

  /* ---- Form -------------------------------------------------------------- */

  const form = useBookingForm({
    sessionEmail,
    maxPartySize: settings.maxPartySize,
    defaultLocationId: locations[0]?.id,
  });

  const { resetSignature } = useBookingPrefill({
    locations,
    status,
    maxPartySize: settings.maxPartySize,
    isTouched: form.isTouched,
    applyPatch: form.applyPatch,
  });

  /* ---- Submit ------------------------------------------------------------ */

  const handleRequireSignin = useCallback(() => {
    // Let a parent (Clerk modal controller) pick this up. Firing a
    // CustomEvent is safe even if nothing is listening.
    window.dispatchEvent(new CustomEvent(EVENTS.REQUIRE_SIGNIN));
  }, []);

  const submit = useBookingSubmit({
    user,
    isUserLoaded,
    values: form.values,
    locations,
    locationsStatus: status,
    maxPartySize: settings.maxPartySize,
    setErrors: form.setErrors,
    onRequireSignin: handleRequireSignin,
  });

  const { clearSubmitError, reset: resetSubmit } = submit;
  const { handleChange, clearErrors } = form;

  const handleFieldChange = useCallback<FieldChangeHandler>(
    (event) => {
      handleChange(event);
      clearSubmitError();
    },
    [clearSubmitError, handleChange],
  );

  const handleModifyBooking = useCallback(() => {
    // Preserve form input so the user doesn't lose their work; only reset
    // the submit/confirmed state.
    resetSubmit();
    clearErrors();
    resetSignature();
  }, [clearErrors, resetSignature, resetSubmit]);

  /* ---- Render ------------------------------------------------------------ */

  return (
    <section
      id={SECTION_ID}
      aria-labelledby={headingId}
      className={SECTION_CLASS}
    >
      <motion.div
        initial={motionEnabled ? "hidden" : false}
        whileInView={motionEnabled ? "visible" : undefined}
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-16 lg:grid-cols-12"
      >
        <BookingIntro motionEnabled={motionEnabled} />

        <motion.div
          variants={motionEnabled ? itemVariants : undefined}
          className={CARD_CLASS}
        >
          <AnimatePresence mode="wait">
            {submit.isSubmitted ? (
              <BookingSuccess
                key="booking-success"
                motionEnabled={motionEnabled}
                snapshot={submit.confirmedSnapshot}
                onModify={handleModifyBooking}
              />
            ) : (
              <BookingForm
                key="booking-form"
                headingId={headingId}
                motionEnabled={motionEnabled}
                values={form.values}
                errors={form.errors}
                submitError={submit.submitError}
                isSubmitting={submit.isSubmitting}
                isSignedOut={isUserLoaded && !user}
                isAuthBlocked={!isUserLoaded || !user}
                locations={locations}
                locationsStatus={status}
                maxPartySize={settings.maxPartySize}
                todayDate={today}
                onChange={handleFieldChange}
                onBlur={form.handleBlur}
                onDateFocus={refreshToday}
                onRetryLocations={retry}
                onSubmit={submit.handleSubmit}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </section>
  );
}
