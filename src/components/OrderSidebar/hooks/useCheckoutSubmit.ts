import { useCallback, useRef, useState } from "react";

import { toast } from "sonner";

import { processCheckout } from "@/app/admin/actions";
import type { CartItem } from "@/types/cart";

import { CHECKOUT_FAILURE_MESSAGE } from "../constants";
import { handleCheckoutResult } from "../lib/checkoutResult";
import { validateCheckoutForm } from "../lib/validation";
import type { CheckoutFormValues } from "../types";
import { useIsMounted } from "./useIsMounted";

interface UseCheckoutSubmitOptions {
  items: readonly CartItem[];
  values: CheckoutFormValues;
  couponCode: string | undefined;
}

export interface UseCheckoutSubmitResult {
  loading: boolean;
  submit: () => Promise<void>;
}

export function useCheckoutSubmit({
  items,
  values,
  couponCode,
}: UseCheckoutSubmitOptions): UseCheckoutSubmitResult {
  const isMounted = useIsMounted();

  const [loading, setLoading] = useState(false);

  /** Authoritative guard so a double click cannot start two checkouts. */
  const inFlightRef = useRef(false);

  const submit = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return;

    const validationError = validateCheckoutForm(values);

    if (validationError) {
      toast.error(validationError);
      return;
    }

    inFlightRef.current = true;
    setLoading(true);

    try {
      const result = await processCheckout({
        cartItems: items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
        })),
        orderType: values.orderType,
        paymentMethod: values.paymentMethod,
        address: values.address,
        phone: values.phone,
        customerName: values.customerName,
        couponCode,
      });

      if (!isMounted()) return;

      handleCheckoutResult(result);
    } catch (error) {
      if (!isMounted()) return;

      console.error("[OrderSidebar] checkout submission failed", error);
      toast.error(CHECKOUT_FAILURE_MESSAGE);
    } finally {
      inFlightRef.current = false;

      if (isMounted()) setLoading(false);
    }
  }, [couponCode, isMounted, items, values]);

  return { loading, submit };
}
