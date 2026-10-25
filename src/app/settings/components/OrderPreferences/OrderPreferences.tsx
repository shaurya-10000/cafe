"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Banknote, CreditCard, Store, Truck } from "lucide-react";
import { useUserPreferences } from "@/utils/preferences/useUserPreferences";
import type {
  PreferredOrderType,
  PreferredPaymentMethod,
  UserPreferences,
} from "@/utils/preferences/useUserPreferences";
import { Feedback } from "../shared/Feedback";
import type { FeedbackState } from "../shared/Feedback";
import { SectionHeader } from "../shared/SectionHeader";
import { CARD } from "../shared/styles";
import { ChoiceGroup } from "./components/ChoiceGroup";
import type { ChoiceOption } from "./components/ChoiceGroup";
import { SavedDetailsForm } from "./components/SavedDetailsForm";

const ORDER_TYPE_OPTIONS: readonly ChoiceOption<PreferredOrderType>[] = [
  {
    value: "pickup",
    label: "Pickup",
    description: "Collect it at the cafe",
    icon: Store,
  },
  {
    value: "delivery",
    label: "Delivery",
    description: "Bring it to my address",
    icon: Truck,
  },
];

const PAYMENT_OPTIONS: readonly ChoiceOption<PreferredPaymentMethod>[] = [
  {
    value: "online",
    label: "Pay online",
    description: "Pay now at checkout",
    icon: CreditCard,
  },
  {
    value: "in_person",
    label: "Pay in person",
    description: "Pay when I arrive",
    icon: Banknote,
  },
];

const ORDER_TYPE_VALUES = ORDER_TYPE_OPTIONS.map((option) => option.value);
const PAYMENT_VALUES = PAYMENT_OPTIONS.map((option) => option.value);

export default function OrderPreferences() {
  const { user } = useUser();
  const { preferences, loading, save } = useUserPreferences(user?.id ?? null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const update = async (patch: Partial<UserPreferences>) => {
    setSaving(true);
    setFeedback(null);

    const message = await save(patch);

    setSaving(false);
    setFeedback(
      message
        ? { kind: "error", message }
        : { kind: "success", message: "Preference saved." },
    );
  };

  const disabled = loading || saving;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Order"
        accent="preferences"
        description="Your saved contact details and usual way to order. Checkout starts with these, and you can change them on any order."
      />

      <SavedDetailsForm
        preferences={preferences}
        loading={loading}
        save={save}
      />

      <div className={`${CARD} space-y-8`}>
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          Usual choices
        </h2>

        <ChoiceGroup
          legend="Order type"
          options={ORDER_TYPE_OPTIONS}
          values={ORDER_TYPE_VALUES}
          selected={preferences?.default_order_type ?? undefined}
          onChange={(value) => void update({ default_order_type: value })}
          disabled={disabled}
        />

        <ChoiceGroup
          legend="Payment method"
          options={PAYMENT_OPTIONS}
          values={PAYMENT_VALUES}
          selected={preferences?.default_payment_method ?? undefined}
          onChange={(value) => void update({ default_payment_method: value })}
          disabled={disabled}
        />

        <Feedback feedback={feedback} />
      </div>
    </div>
  );
}
