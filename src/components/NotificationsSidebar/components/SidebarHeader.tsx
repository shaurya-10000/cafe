import {
  Bell,
  BellOff,
  SlidersHorizontal,
  Smartphone,
  SmartphoneNfc,
  X,
} from "lucide-react";
import { isPushSupported } from "@/utils/media/push";
import type { PushState } from "../types";
import { HeaderIconButton } from "./HeaderIconButton";

interface SidebarHeaderProps {
  readonly pushState: PushState;
  readonly pushLoading: boolean;
  readonly onTogglePush: () => void;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly preferencesOpen: boolean;
  readonly onTogglePreferences: () => void;
  readonly onClose: () => void;
}

export function SidebarHeader({
  pushState,
  pushLoading,
  onTogglePush,
  muted,
  onToggleMuted,
  preferencesOpen,
  onTogglePreferences,
  onClose,
}: SidebarHeaderProps) {
  const pushSubscribed = pushState === "subscribed";
  const showPushToggle = isPushSupported() && pushState !== "denied";

  return (
    <div className="flex items-center justify-between border-b border-zinc-100 p-8 dark:border-white/5">
      <div>
        <h2 className="text-xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-zinc-100">
          Activity
        </h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
          Real-time Updates
        </p>
      </div>

      <div className="flex items-center gap-2">
        {showPushToggle && (
          <HeaderIconButton
            label={
              pushSubscribed
                ? "Disable push notifications"
                : "Enable push notifications"
            }
            onClick={onTogglePush}
            disabled={pushLoading}
            pressed={pushSubscribed}
            active={pushSubscribed}
          >
            {pushSubscribed ? (
              <SmartphoneNfc size={18} aria-hidden="true" />
            ) : (
              <Smartphone size={18} aria-hidden="true" />
            )}
          </HeaderIconButton>
        )}

        <HeaderIconButton
          label={muted ? "Unmute notifications" : "Mute notifications"}
          onClick={onToggleMuted}
          pressed={muted}
          active={muted}
        >
          {muted ? (
            <BellOff size={18} aria-hidden="true" />
          ) : (
            <Bell size={18} aria-hidden="true" />
          )}
        </HeaderIconButton>

        <HeaderIconButton
          label="Notification preferences"
          onClick={onTogglePreferences}
          expanded={preferencesOpen}
          active={preferencesOpen}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
        </HeaderIconButton>

        <HeaderIconButton label="Close notifications" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </HeaderIconButton>
      </div>
    </div>
  );
}
