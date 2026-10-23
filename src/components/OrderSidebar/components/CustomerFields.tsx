import { memo } from "react";

import { User } from "lucide-react";

import { cx } from "../lib/cx";
import { FIELD_BASE, FIELD_LABEL, FOCUS_RING } from "../styles";
import type { CheckoutFormValues, SetCheckoutField } from "../types";

interface CustomerFieldsProps {
  values: CheckoutFormValues;
  setField: SetCheckoutField;
}

export const CustomerFields = memo(function CustomerFields({
  values,
  setField,
}: CustomerFieldsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="order-customer-name" className={FIELD_LABEL}>
          Customer Profile
        </label>

        <div className="relative">
          <User
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={16}
            aria-hidden="true"
          />

          <input
            id="order-customer-name"
            type="text"
            placeholder="FULL NAME"
            value={values.customerName}
            onChange={(event) => setField("customerName", event.target.value)}
            autoComplete="name"
            className={cx(FIELD_BASE, "pl-12", FOCUS_RING)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="order-phone" className={FIELD_LABEL}>
          Secure Contact
        </label>

        <input
          id="order-phone"
          type="tel"
          placeholder="PHONE NUMBER"
          value={values.phone}
          onChange={(event) => setField("phone", event.target.value)}
          autoComplete="tel"
          className={cx(FIELD_BASE, FOCUS_RING)}
        />
      </div>

      {values.orderType === "delivery" && (
        <div className="space-y-2">
          <label htmlFor="order-address" className={FIELD_LABEL}>
            Delivery Node
          </label>

          <textarea
            id="order-address"
            placeholder="STREET ADDRESS / APARTMENT / CITY"
            value={values.address}
            onChange={(event) => setField("address", event.target.value)}
            rows={3}
            autoComplete="street-address"
            className={cx(
              FIELD_BASE,
              "resize-none leading-relaxed",
              FOCUS_RING,
            )}
          />
        </div>
      )}
    </div>
  );
});
