"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { UserPreferences } from "@/utils/preferences/useUserPreferences";
import { Feedback } from "../../shared/Feedback";
import type { FeedbackState } from "../../shared/Feedback";
import { CARD, FIELD, LABEL, PRIMARY_BUTTON } from "../../shared/styles";
import { formatUsPhone, maskPhone, validateUsPhone } from "../lib/phone";

const MAX_ADDRESS_LENGTH = 500;

interface SavedDetailsFormProps {
  readonly preferences: UserPreferences | null;
  readonly loading: boolean;
  readonly save: (patch: Partial<UserPreferences>) => Promise<string | null>;
}

export function SavedDetailsForm({
  preferences,
  loading,
  save,
}: SavedDetailsFormProps) {
  // null means "untouched": the saved value is shown instead.
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [addressDraft, setAddressDraft] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const savedPhone = preferences?.phone ?? "";
  const savedAddress = preferences?.address ?? "";

  // A saved number is only ever shown masked; changing it means retyping it.
  const showMasked = savedPhone !== "" && !editingPhone;
  const phoneInput = phoneDraft ?? "";
  const nextPhone = showMasked ? savedPhone : phoneInput;
  const address = addressDraft ?? savedAddress;

  const phoneError = showMasked ? null : validateUsPhone(phoneInput);
  const addressError =
    address.trim().length > MAX_ADDRESS_LENGTH
      ? `Keep the address under ${MAX_ADDRESS_LENGTH} characters.`
      : null;

  const isDirty =
    nextPhone !== savedPhone || address.trim() !== savedAddress;
  const canSave =
    isDirty && !phoneError && !addressError && !saving && !loading;

  const startEditingPhone = () => {
    setEditingPhone(true);
    setPhoneDraft("");
    setFeedback(null);
  };

  const cancelEditingPhone = () => {
    setEditingPhone(false);
    setPhoneDraft(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;

    setSaving(true);
    setFeedback(null);

    const message = await save({
      phone: nextPhone || null,
      address: address.trim() || null,
    });

    setSaving(false);

    if (message) {
      setFeedback({ kind: "error", message });
      return;
    }

    setPhoneDraft(null);
    setAddressDraft(null);
    setEditingPhone(false);
    setFeedback({
      kind: "success",
      message: "Saved. Checkout will start with these details.",
    });
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={`${CARD} space-y-6`}
    >
      <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
        Saved details
      </h2>

      <div className="space-y-2">
        <span id="saved-phone-label" className={LABEL}>
          Phone number (US)
        </span>

        {showMasked ? (
          <div className="flex items-center gap-3">
            <div
              className={`${FIELD} min-w-0 flex-1 font-mono tracking-wider`}
            >
              {maskPhone(savedPhone)}
            </div>
            <button
              type="button"
              onClick={startEditingPhone}
              className="shrink-0 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-cafe-accent transition-colors hover:bg-cafe-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <input
                id="saved-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={14}
                placeholder="(555) 123-xxxx"
                aria-labelledby="saved-phone-label"
                aria-invalid={phoneError !== null}
                value={phoneInput}
                disabled={loading}
                onChange={(event) => {
                  setPhoneDraft(formatUsPhone(event.target.value));
                  setFeedback(null);
                }}
                className={`${FIELD} min-w-0 flex-1`}
              />
              {savedPhone !== "" && (
                <button
                  type="button"
                  onClick={cancelEditingPhone}
                  className="shrink-0 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cafe-accent dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              )}
            </div>

            {savedPhone !== "" && (
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Leave it empty and save to remove your number.
              </p>
            )}
          </>
        )}

        {phoneError && (
          <p role="alert" className="text-xs font-bold text-red-500">
            {phoneError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="saved-address" className={LABEL}>
          Delivery address
        </label>
        <textarea
          id="saved-address"
          rows={3}
          autoComplete="street-address"
          placeholder="Street, apartment, city, state, ZIP"
          value={address}
          disabled={loading}
          aria-invalid={addressError !== null}
          onChange={(event) => {
            setAddressDraft(event.target.value);
            setFeedback(null);
          }}
          className={`${FIELD} resize-none leading-relaxed`}
        />
        {addressError && (
          <p role="alert" className="text-xs font-bold text-red-500">
            {addressError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Feedback feedback={feedback} />
        <button
          type="submit"
          disabled={!canSave}
          className={`${PRIMARY_BUTTON} ml-auto`}
        >
          {saving ? "Saving" : "Save details"}
        </button>
      </div>
    </form>
  );
}
