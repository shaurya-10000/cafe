"use client";

import { useId, useRef } from "react";
import { AnimatePresence, useReducedMotion } from "framer-motion";
import { ModalFrame } from "./components/ModalFrame";
import { ProductContent } from "./components/ProductContent";
import { useBodyScrollLock } from "./hooks/useBodyScrollLock";
import { useFocusTrap } from "./hooks/useFocusTrap";
import type { ProductDetailModalProps } from "./types";

export default function ProductDetailModal({
  item,
  onClose,
  onAddToCart,
  isFavorited,
  isFavoritePending,
  onToggleFavorite,
  currency,
}: ProductDetailModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion() ?? false;

  const isOpen = item !== null;
  useBodyScrollLock(isOpen);
  useFocusTrap(isOpen, dialogRef, onClose);

  return (
    <AnimatePresence>
      {item && (
        <ModalFrame
          key="product-modal"
          titleId={titleId}
          dialogRef={dialogRef}
          reducedMotion={reducedMotion}
          onClose={onClose}
        >
          <ProductContent
            key={item.id}
            item={item}
            titleId={titleId}
            currency={currency}
            reducedMotion={reducedMotion}
            isFavorited={isFavorited}
            isFavoritePending={isFavoritePending}
            onToggleFavorite={onToggleFavorite}
            onAddToCart={onAddToCart}
            onClose={onClose}
          />
        </ModalFrame>
      )}
    </AnimatePresence>
  );
}
