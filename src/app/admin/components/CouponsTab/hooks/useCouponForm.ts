import { useCallback, useRef, useState } from "react";

import {
  createCoupon,
  updateCoupon,
  type Coupon,
  type CouponFormData,
} from "@/app/admin/actions/couponActions";

import { couponToFormData, createEmptyForm } from "../lib/form";
import { useIsMounted } from "./useIsMounted";
import { useLatestRef } from "./useLatestRef";

interface UseCouponFormOptions {
  /** Called after a successful create/update (e.g. to refresh the list). */
  onSaved: () => void;
}

export interface UseCouponFormResult {
  isOpen: boolean;
  /** `true` when editing an existing coupon, `false` when creating. */
  isEditing: boolean;
  values: CouponFormData;
  error: string | null;
  submitting: boolean;
  openCreate: () => void;
  openEdit: (coupon: Coupon) => void;
  close: () => void;
  setField: <K extends keyof CouponFormData>(
    key: K,
    value: CouponFormData[K],
  ) => void;
  submit: () => Promise<void>;
}

export function useCouponForm({ onSaved }: UseCouponFormOptions): UseCouponFormResult {
  const isMounted = useIsMounted();
  const onSavedRef = useLatestRef(onSaved);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<CouponFormData>(createEmptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const inFlightRef = useRef(false);

  const openCreate = useCallback(() => {
    setValues(createEmptyForm());
    setEditingId(null);
    setError(null);
    setIsOpen(true);
  }, []);

  const openEdit = useCallback((coupon: Coupon) => {
    setValues(couponToFormData(coupon));
    setEditingId(coupon.id);
    setError(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const setField = useCallback(
    <K extends keyof CouponFormData>(key: K, value: CouponFormData[K]) => {
      setValues((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const submit = useCallback(async (): Promise<void> => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const result = editingId
        ? await updateCoupon(editingId, values)
        : await createCoupon(values);

      if (!isMounted()) return;

      if (!result.success) {
        setError(result.error ?? "Unknown error");
        return;
      }

      setIsOpen(false);
      onSavedRef.current();
    } catch (submitError) {
      console.error("[CouponsTab] coupon save failed", submitError);

      if (isMounted()) setError("Couldn't save the coupon. Please try again.");
    } finally {
      inFlightRef.current = false;

      if (isMounted()) setSubmitting(false);
    }
  }, [editingId, isMounted, onSavedRef, values]);

  return {
    isOpen,
    isEditing: editingId !== null,
    values,
    error,
    submitting,
    openCreate,
    openEdit,
    close,
    setField,
    submit,
  };
}
