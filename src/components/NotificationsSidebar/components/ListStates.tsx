import { Inbox } from "lucide-react";

const PLACEHOLDER_CLASSES =
  "flex h-full flex-col items-center justify-center text-center opacity-40";

const PLACEHOLDER_TEXT_CLASSES =
  "text-[11px] font-black uppercase tracking-widest";

export function NotificationsLoading() {
  return (
    <div className={PLACEHOLDER_CLASSES}>
      <p className={PLACEHOLDER_TEXT_CLASSES}>Loading&hellip;</p>
    </div>
  );
}

export function NotificationsEmpty() {
  return (
    <div className={PLACEHOLDER_CLASSES}>
      <Inbox size={40} strokeWidth={1} className="mb-4" aria-hidden="true" />
      <p className={PLACEHOLDER_TEXT_CLASSES}>No recent updates</p>
    </div>
  );
}
