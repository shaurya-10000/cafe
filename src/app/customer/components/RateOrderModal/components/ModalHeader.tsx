import { X } from "lucide-react";

import {
  CLOSE_BUTTON_CLASS,
  HEADER_ORDER_ID_CLASS,
  HEADER_TITLE_CLASS,
} from "../styles";

interface ModalHeaderProps {
  orderId: string;
  onClose: () => void;
}

export function ModalHeader({ orderId, onClose }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className={HEADER_TITLE_CLASS}>Rate Your Order</h2>
        <p className={HEADER_ORDER_ID_CLASS}>#{orderId.slice(0, 8)}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className={CLOSE_BUTTON_CLASS}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}