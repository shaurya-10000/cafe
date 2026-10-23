import { memo, useCallback } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { getViewSlide, getViewTransition } from "../lib/motion";
import type {
  CheckoutFormValues,
  OrderType,
  PaymentMethod,
  SetCheckoutField,
} from "../types";
import { CustomerFields } from "./CustomerFields";
import { OrderTypeSelector } from "./OrderTypeSelector";
import { PaymentMethodSelector } from "./PaymentMethodSelector";

interface OptionsViewProps {
  values: CheckoutFormValues;
  setField: SetCheckoutField;
}

export const OptionsView = memo(function OptionsView({
  values,
  setField,
}: OptionsViewProps) {
  const reducedMotion = useReducedMotion() ?? false;

  const handleOrderTypeChange = useCallback(
    (value: OrderType) => setField("orderType", value),
    [setField],
  );

  const handlePaymentChange = useCallback(
    (value: PaymentMethod) => setField("paymentMethod", value),
    [setField],
  );

  return (
    <motion.div
      {...getViewSlide("right", reducedMotion)}
      transition={getViewTransition(reducedMotion)}
      className="sidebar-scroll flex flex-1 flex-col gap-8 overflow-y-auto p-6"
    >
      <OrderTypeSelector
        value={values.orderType}
        onChange={handleOrderTypeChange}
      />

      <CustomerFields values={values} setField={setField} />

      <PaymentMethodSelector
        value={values.paymentMethod}
        onChange={handlePaymentChange}
      />
    </motion.div>
  );
});
