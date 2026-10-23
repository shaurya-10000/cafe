import { useCallback, useState } from "react";

import { INITIAL_FORM_VALUES } from "../constants";
import type {
  CheckoutFormValues,
  CheckoutPrefillDetail,
  SetCheckoutField,
} from "../types";

export interface UseCheckoutFormResult {
  values: CheckoutFormValues;
  setField: SetCheckoutField;
  applyPrefill: (detail: CheckoutPrefillDetail) => void;
}

/**
 * @param defaultName Session display name; only used while the name field is
 *                    still empty, so it never overwrites what was typed.
 */
export function useCheckoutForm(
  defaultName: string | null | undefined,
): UseCheckoutFormResult {
  const [values, setValues] = useState<CheckoutFormValues>(() =>
    defaultName
      ? { ...INITIAL_FORM_VALUES, customerName: defaultName }
      : INITIAL_FORM_VALUES,
  );

  // The session name can arrive after mount: prefill then, but only while the
  // field is still empty. Adjusted during render, guarded by the previous value.
  const [previousDefaultName, setPreviousDefaultName] = useState(defaultName);
  if (previousDefaultName !== defaultName) {
    setPreviousDefaultName(defaultName);

    if (defaultName) {
      setValues((prev) =>
        prev.customerName ? prev : { ...prev, customerName: defaultName },
      );
    }
  }

  const setField = useCallback<SetCheckoutField>((key, value) => {
    setValues((prev) =>
      prev[key] === value ? prev : { ...prev, [key]: value },
    );
  }, []);

  const applyPrefill = useCallback((detail: CheckoutPrefillDetail) => {
    setValues((prev) => {
      const next = { ...prev };

      if (typeof detail.name === "string") next.customerName = detail.name;
      if (typeof detail.phone === "string") next.phone = detail.phone;
      if (typeof detail.address === "string") next.address = detail.address;

      if (detail.orderType === "delivery" || detail.orderType === "pickup") {
        next.orderType = detail.orderType;
      }

      if (
        detail.paymentMethod === "online" ||
        detail.paymentMethod === "in_person"
      ) {
        next.paymentMethod = detail.paymentMethod;
      }

      return next;
    });
  }, []);

  return { values, setField, applyPrefill };
}
