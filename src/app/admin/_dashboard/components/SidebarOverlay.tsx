import { memo } from "react";

interface SidebarOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarOverlay = memo(function SidebarOverlay({
  isOpen,
  onClose,
}: SidebarOverlayProps) {
  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      aria-hidden="true"
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm dark:bg-black/80"
    />
  );
});
