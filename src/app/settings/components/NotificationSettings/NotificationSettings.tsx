"use client";

import { useApp } from "@/utils/providers/AppContext";
import {
  ALL_TYPES,
  TYPE_LABEL,
} from "@/components/NotificationsSidebar/notificationTypes";
import { SectionHeader } from "../shared/SectionHeader";
import { Switch } from "../shared/Switch";
import { CARD, LABEL } from "../shared/styles";

export default function NotificationSettings() {
  const {
    notificationsMuted,
    toggleNotificationsMuted,
    mutedTypes,
    toggleTypeMuted,
  } = useApp();

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notification"
        accent="settings"
        description="Choose which updates you hear about. Push alerts for this device are managed from the bell in the header."
      />

      <div className={`${CARD} space-y-6`}>
        <Switch
          checked={!notificationsMuted}
          onChange={() => void toggleNotificationsMuted()}
          label="Notifications"
          description="Turn off to mute everything"
        />

        <div className="space-y-1 border-t border-zinc-100 pt-6 dark:border-white/5">
          <p className={`${LABEL} mb-3 px-4`}>Notify me about</p>

          {ALL_TYPES.map((type) => (
            <Switch
              key={type}
              checked={!mutedTypes.includes(type)}
              onChange={() => void toggleTypeMuted(type)}
              label={TYPE_LABEL[type]}
              disabled={notificationsMuted}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
